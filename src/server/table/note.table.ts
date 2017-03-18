import _ = require("lodash");
import {injectable} from "inversify";
import sequelize = require("sequelize");

import {NoteEntity} from "../../common/entity/note.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";
import {TimeLogTable} from "./time-log.table";
import {ProfitLogTable} from "./profit-log.table";
import {TableService} from "../service/table.service";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {EvernoteClientService} from "../service/evernote-client.service";
import {IBaseTableParams} from "./base.table";
import {IMyFindEntityOptions} from "../../common/entity/base-multi.entity";

export interface IMyFindNoteEntityOptions extends IMyFindEntityOptions {
  includeContent?: boolean;
}

@injectable()
export class NoteTable extends BaseMultiEvernoteTable<NoteEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, allowNull: false, unique: true},
      title: {type: sequelize.STRING, allowNull: false},
      content: {type: sequelize.TEXT, allowNull: true},
      contentHash: {type: sequelize.TEXT, allowNull: false},
      created: {type: sequelize.BIGINT, allowNull: true},
      updated: {type: sequelize.BIGINT, allowNull: true},
      deleted: {type: sequelize.BIGINT, allowNull: true},
      active: {type: sequelize.BOOLEAN, allowNull: false},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      notebookGuid: {type: sequelize.STRING, allowNull: true},
      tagGuids: {type: sequelize.TEXT, allowNull: true},
    },
    options: {
      indexes: [],
    },
    jsonFields: ["contentHash", "tagGuids"],
  };

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async findAll(options: IMyFindNoteEntityOptions): Promise<NoteEntity[]> {
    let notes = await super.findAll(options);
    if (options.includeContent) {
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
    await this.save(note);
    await this.parseNote(lastNote);
    this.message("load", ["remote"], "note", false, {guid: lastNote.guid, title: lastNote.title});
    return lastNote;
  }

  async reParseNotes(query = {}): Promise<void> {
    let options: IMyFindNoteEntityOptions = {};
    options.where = query;
    options.limit = 0;
    options.includeContent = true;
    let notes = await this.findAll(options);
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
