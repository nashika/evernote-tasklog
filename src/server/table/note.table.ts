import _ = require("lodash");
import {injectable} from "inversify";

import {NoteEntity, INoteEntityFindOptions} from "../../common/entity/note.entity";
import {MyPromise} from "../../common/util/my-promise";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {TimeLogTable} from "./time-log.table";
import {ProfitLogTable} from "./profit-log.table";
import {TableService} from "../service/table.service";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {EvernoteClientService} from "../service/evernote-client.service";

@injectable()
export class NoteTable extends BaseMultiEvernoteTable<NoteEntity, INoteEntityFindOptions> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  find(options: INoteEntityFindOptions): Promise<NoteEntity[]> {
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

  loadRemote(guid: string): Promise<NoteEntity> {
    let lastNote: NoteEntity = null;
    this.message("load", ["remote"], "note", true, {guid: guid});
    return Promise.resolve().then(() => {
      return this.evernoteClientService.getNote(this.globalUser, guid);
    }).then((note: NoteEntity) => {
      lastNote = note;
      return this.saveByGuid(note, true);
    }).then(() => {
      return this.parseNote(lastNote);
    }).then(() => {
      this.message("load", ["remote"], "note", false, {guid: lastNote.guid, title: lastNote.title});
      return lastNote;
    });
  }

  reParseNotes(query = {}): Promise<void> {
    let options: INoteEntityFindOptions = {};
    options.query = query;
    options.limit = 0;
    options.content = true;
    return this.find(options).then(notes => {
      return MyPromise.eachSeries(notes, note => {
        return this.parseNote(note);
      });
    });
  }

  private parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return Promise.resolve();
    this.message("parse", ["local"], "note", true, {guid: note.guid, title: note.title});
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
      this.message("parse", ["local"], "note", false, {guid: note.guid, title: note.title});
    });
  }

}
