import _ = require("lodash");
import {injectable} from "inversify";
import sequelize = require("sequelize");

import {NoteEntity} from "../../common/entity/note.entity";
import {BaseEvernoteTable} from "./base-evernote.table";
import {TimeLogTable} from "./time-log.table";
import {ProfitLogTable} from "./profit-log.table";
import {TableService} from "../service/table.service";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {EvernoteClientService} from "../service/evernote-client.service";
import {IBaseTableParams, ISequelizeInstance} from "./base.table";
import {IFindEntityOptions} from "../../common/entity/base.entity";

export interface IFindNoteEntityOptions extends IFindEntityOptions {
  includeContent?: boolean;
}

@injectable()
export class NoteTable extends BaseEvernoteTable<NoteEntity> {

  static params: IBaseTableParams = {
    fields: {
      guid: {type: sequelize.STRING, primaryKey: true},
      title: {type: sequelize.STRING, allowNull: false},
      content: {type: sequelize.TEXT},
      contentHash: {type: sequelize.TEXT, allowNull: false},
      contentLength: {type: sequelize.INTEGER, allowNull: false},
      created: {type: sequelize.BIGINT},
      updated: {type: sequelize.BIGINT},
      deleted: {type: sequelize.BIGINT},
      active: {type: sequelize.BOOLEAN, allowNull: false},
      updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
      notebookGuid: {type: sequelize.STRING},
      tagGuids: {type: sequelize.TEXT},
      resources: {type: sequelize.TEXT},
      "attributes__subjectDate": {type: sequelize.BIGINT},
      "attributes__latitude": {type: sequelize.DOUBLE},
      "attributes__longitude": {type: sequelize.DOUBLE},
      "attributes__altitude": {type: sequelize.DOUBLE},
      "attributes__author": {type: sequelize.STRING},
      "attributes__source": {type: sequelize.STRING},
      "attributes__sourceURL": {type: sequelize.STRING},
      "attributes__sourceApplication": {type: sequelize.STRING},
      "attributes__shareDate": {type: sequelize.BIGINT},
      "attributes__reminderOrder": {type: sequelize.BIGINT},
      "attributes__reminderDoneTime": {type: sequelize.BIGINT},
      "attributes__reminderTime": {type: sequelize.BIGINT},
      "attributes__placeName": {type: sequelize.STRING},
      "attributes__contentClass": {type: sequelize.STRING},
      "attributes__applicationData": {type: sequelize.TEXT},
      "attributes__classifications": {type: sequelize.TEXT},
      "attributes__creatorId": {type: sequelize.INTEGER},
      "attributes__lastEditorId": {type: sequelize.INTEGER},
      "attributes__sharedWithBusiness": {type: sequelize.BOOLEAN},
      "attributes__conflictSourceNoteGuid": {type: sequelize.STRING},
      "attributes__noteTitleQuality": {type: sequelize.INTEGER},
      tagNames: {type: sequelize.TEXT},
      sharedNotes: {type: sequelize.TEXT},
      restrictions: {type: sequelize.TEXT},
      limits: {type: sequelize.TEXT},
    },
    options: {
      indexes: [],
    },
    jsonFields: ["contentHash", "tagGuids", "resources", "attributes__applicationData", "tagNames", "sharedNotes", "restrictions", "limits"],
  };

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async findAll(options: IFindNoteEntityOptions): Promise<NoteEntity[]> {
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

  protected prepareSaveEntity(entity: NoteEntity): any {
    _.each(entity.attributes || {}, (value, key) => {
      _.set(entity, `attributes__${key}`, value);
    });
    delete entity.attributes;
    return super.prepareSaveEntity(entity);
  }

  protected prepareLoadEntity(instance: ISequelizeInstance<NoteEntity>): NoteEntity {
    let entity = super.prepareLoadEntity(instance);
    _(_.keys(entity)).filter(key => _.includes(key, "__")).each(key => {
      _.set(entity, key.replace("__", "."), _.get(entity, key));
      _.unset(entity, key);
    });
    return entity;
  }

  async loadRemote(guid: string): Promise<NoteEntity> {
    this.message("load", ["remote"], "note", true, {guid: guid});
    let note = await this.evernoteClientService.getNote(guid);
    let lastNote: NoteEntity = note;
    await this.save(note, true);
    await this.parseNote(lastNote);
    this.message("load", ["remote"], "note", false, {guid: lastNote.guid, title: lastNote.title});
    return lastNote;
  }

  async reParseNotes(query = {}): Promise<void> {
    let options: IFindNoteEntityOptions = {};
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
    await this.tableService.getTable<TimeLogTable>(TimeLogEntity).parse(note, lines);
    await this.tableService.getTable<ProfitLogTable>(ProfitLogEntity).parse(note, lines);
    this.message("parse", ["local"], "note", false, {guid: note.guid, title: note.title});
  }

}
