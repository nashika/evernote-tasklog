import _ = require("lodash");
import {injectable} from "inversify";

import {NoteEntity, INoteEntityFindOptions} from "../../common/entity/note.entity";
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

  async find(options: INoteEntityFindOptions): Promise<NoteEntity[]> {
    let notes = await super.find(options);
    if (options.content) {
      return notes;
    } else {
      return _.map(notes, (note: NoteEntity) => {
        note.hasContent = note.content != null;
        note.content = null;
        return note;
      });
    }
  }

  async loadRemote(guid: string): Promise<NoteEntity> {
    let lastNote: NoteEntity = null;
    this.message("load", ["remote"], "note", true, {guid: guid});
    let note = await this.evernoteClientService.getNote(this.globalUser, guid);
    lastNote = note;
    await this.saveByGuid(note, true);
    await this.parseNote(lastNote);
    this.message("load", ["remote"], "note", false, {guid: lastNote.guid, title: lastNote.title});
    return lastNote;
  }

  async reParseNotes(query = {}): Promise<void> {
    let options: INoteEntityFindOptions = {};
    options.query = query;
    options.limit = 0;
    options.content = true;
    let notes = await this.find(options);
    for (let note of notes) {
      await this.parseNote(note);
    }
  }

  private async parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return;
    this.message("parse", ["local"], "note", true, {guid: note.guid, title: note.title});
    let content: string = note.content;
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
    let lines: string[] = [];
    for (var line of content.split('<>')) {
      lines.push(line.replace(/<[^>]*>/g, ''));
    }
    await this.tableService.getUserTable<TimeLogTable>(TimeLogEntity, this.globalUser).parse(note, lines);
    await this.tableService.getUserTable<ProfitLogTable>(ProfitLogEntity, this.globalUser).parse(note, lines);
    this.message("parse", ["local"], "note", false, {guid: note.guid, title: note.title});
  }

}
