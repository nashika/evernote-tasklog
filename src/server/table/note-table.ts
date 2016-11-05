import _ = require("lodash");
import {injectable} from "inversify";
import {getLogger} from "log4js";

import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise} from "../../common/util/my-promise";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {TimeLogTable} from "./time-log-table";
import {ProfitLogTable} from "./profit-log-table";
import {TableService} from "../service/table-service";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {EvernoteClientService} from "../service/evernote-client-service";

let logger = getLogger("system");

export interface NoteTableOptions extends IMultiEntityFindOptions {
  content?: boolean;
}

@injectable()
export class NoteTable extends BaseMultiEvernoteTable<NoteEntity, NoteTableOptions> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  find(options: NoteTableOptions): Promise<NoteEntity[]> {
    return super.find(options).then(notes => {
      if (options.content) {
        return notes;
      } else {
        return _.map(notes, (note: NoteEntity) => {
          note.hasContent = note.content != null;
          note.content = null;
          return note;
        });
      }
    });
  }

  getRemoteContent(query: Object): Promise<NoteEntity[]> {
    let options: NoteTableOptions = {};
    options.query = query;
    options.limit = 0;
    return this.find(options).then(notes => {
      let results: NoteEntity[] = [];
      return MyPromise.eachPromiseSeries(notes, (note) => {
        if (note.content || note.hasContent) {
          results.push(note);
          return Promise.resolve();
        } else {
          return this.loadRemote(note.guid).then(loadedNote => {
            results.push(loadedNote);
            // TODO: set hasContentProperty
          });
        }
      }).then(() => {
        return results;
      });
    });
  }

  loadRemote(guid: string): Promise<NoteEntity> {
    let lastNote: NoteEntity = null;
    return Promise.resolve().then(() => {
      return this.evernoteClientService.getNote(this.globalUser, guid);
    }).then((note: NoteEntity) => {
      lastNote = note;
      return this.saveByGuid(note);
    }).then(() => {
      return this.parseNote(lastNote);
    }).then(() => {
      logger.debug(`Loading note from remote was finished. note is loaded. guid=${lastNote.guid} title=${lastNote.title}`);
      return lastNote;
    });
  }

  reParseNotes(query: Object = {}): Promise<void> {
    let options: NoteTableOptions = {};
    options.query = query;
    options.limit = 0;
    options.content = true;
    return this.find(options).then(notes => {
      return MyPromise.eachPromiseSeries(notes, note => {
        return this.parseNote(note);
      });
    });
  }

  protected parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return Promise.resolve();
    logger.debug(`Parsing note was started. guid=${note.guid}, title=${note.title}`);
    let content: string = note.content;
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
    let lines: string[] = [];
    for (var line of content.split('<>')) {
      lines.push(line.replace(/<[^>]*>/g, ''));
    }
    return Promise.resolve().then(() => {
      return this.tableService.getUserTable<TimeLogTable>(TimeLogEntity, this.globalUser).parse(note, lines);
    }).then(() => {
      return this.tableService.getUserTable<ProfitLogTable>(ProfitLogEntity, this.globalUser).parse(note, lines);
    }).then(() => {
      logger.debug(`Parsing note was succeed. guid=${note.guid}`);
    });
  }

}
