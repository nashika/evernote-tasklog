import _ = require("lodash");
import {injectable} from "inversify";
import moment = require("moment");
import Vue from "vue";
import Component from "vue-class-component";

import {NoteEntity} from "../../common/entity/note.entity";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseClientService} from "./base-client.service";
import {ProgressService} from "./progress.service";
import {RequestService} from "./request.service";
import {TagEntity} from "../../common/entity/tag.entity";
import {IFindNoteEntityOptions} from "../../server/table/note.table";
import {IFindEntityOptions} from "../../common/entity/base.entity";
import {configLoader} from "../../common/util/config-loader";
import {SocketIoClientService} from "./socket-io-client-service";
import {logger} from "../logger";

export interface IDatastoreServiceNoteFilterParams {
  start?: moment.Moment;
  end?: moment.Moment;
  notebookGuids?: string[];
  stacks?: string[];
  hasContent?: boolean;
  archiveMinStepMinute?: number;
}

interface IDatastoreServiceTimeLogFilterParams {
  start?: moment.Moment;
  end?: moment.Moment;
  noteGuids?: string[];
}

export class TerminateResult {
  constructor(public data: any = null) {
  }
  toString(): string {
    return this.data;
  }
}

export type TNotesResult = {[guid: string]: NoteEntity};
export type TTimeLogsResult = {[noteGuid: string]: {[id: number]: TimeLogEntity}};
export type TProfitLogsResult = {[noteGuid: string]: {[id: number]: ProfitLogEntity}};

export interface INoteLogsResult {
  notes: TNotesResult;
  timeLogs: TTimeLogsResult;
  profitLogs: TProfitLogsResult;
}

@Component({})
export class DatastoreServiceEventBus extends Vue {
  lastUpdateCount: number = 0;
  user: any = null;
  currentPersonId: number = 0;
  notebooks: {[guid: string]: NotebookEntity} = {};
  stacks: string[] = [];
  tags: {[guid: string]: TagEntity} = {};
}

@injectable()
export class DatastoreService extends BaseClientService {

  $vm = new DatastoreServiceEventBus();

  constructor(protected requestService: RequestService,
              protected progressService: ProgressService,
              protected socketIoClientService: SocketIoClientService) {
    super();
  }

  get currentPerson(): config.IPersonConfig {
    return _.find(configLoader.app.persons, {id: this.$vm.currentPersonId});
  }

  async initialize(): Promise<void> {
    this.socketIoClientService.on(this, "sync::updateNotebooks", this.syncNotebooks);
    this.socketIoClientService.on(this, "sync::updateTags", this.syncTags);
    this.$vm.user = await this.requestService.loadOption("user");
    this.$vm.currentPersonId = _.toInteger(await this.requestService.loadSession("currentPersonId"));
    await this.syncNotebooks();
    await this.syncTags();
  }

  makeDefaultNoteFilterParams(params: config.IDefaultFilterParamsConfig): IDatastoreServiceNoteFilterParams {
    let result: IDatastoreServiceNoteFilterParams = {};
    result.stacks = params.stacks || [];
    result.notebookGuids = _(params.notebooks || []).map((notebookName: string) => this.$vm.notebooks[notebookName].guid).value();
    return result;
  }

  private async syncNotebooks(): Promise<void> {
    logger.debug(`Synchronizing notebooks.`);
    let notebooks = await this.requestService.find<NotebookEntity>(NotebookEntity);
    this.$vm.notebooks = _.keyBy(notebooks, "guid");
    this.$vm.stacks = _(notebooks).map("stack").uniq().value();
  }

  private async syncTags(): Promise<void> {
    logger.debug(`Synchronizing tags.`);
    let tags = await this.requestService.find<TagEntity>(TagEntity);
    this.$vm.tags = _.keyBy(tags, "guid");
  }

  async getNoteLogs(params: IDatastoreServiceNoteFilterParams = {}): Promise<INoteLogsResult> {
    if (this.progressService.isActive) return null;
    let result: INoteLogsResult = {notes: null, timeLogs: null, profitLogs: null};
    this.progressService.open(7);
    try {
      await this.runSync();
      await this.checkNoteCount(params);
      result.notes = await this.getNotes(params);
      await this.getNoteContents(result.notes);
      result.timeLogs = await this.getTimeLogs(result.notes, params);
      result.profitLogs = await this.getProfitLogs(result.notes);
      this.progressService.next("Done.");
    } catch (err) {
      alert(err);
      if (!(err instanceof TerminateResult)) throw err;
    } finally {
      this.progressService.close();
    }
    return result;
  }

  async getArchiveLogs(params: IDatastoreServiceNoteFilterParams = {}): Promise<NoteEntity[]> {
    if (this.progressService.isActive) return null;
    this.progressService.open(4);
    let archiveNotes: NoteEntity[];
    try {
      await this.runSync();
      await this.checkNoteCount(params);
      archiveNotes = await this.getArchiveNotes(params);
      this.progressService.next("Done.");
    } catch (err) {
      alert(err);
      if (!(err instanceof TerminateResult)) throw err;
    } finally {
      this.progressService.close();
    }
    return archiveNotes;
  }

  private async runSync(): Promise<void> {
    this.progressService.next("Syncing remote server.");
    await this.requestService.sync();
  }

  private async checkNoteCount(params: IDatastoreServiceNoteFilterParams): Promise<void> {
    this.progressService.next("Checking notes count.");
    let options = this.makeNoteFindOptions(params);
    let count = await this.requestService.count(NoteEntity, options);
    if (count > configLoader.app.warningNoteCount)
      if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
        throw new TerminateResult(`User Canceled`);
  }

  protected async getNotes(params: IDatastoreServiceNoteFilterParams): Promise<TNotesResult> {
    this.progressService.next("Getting notes.");
    let options = this.makeNoteFindOptions(params);
    let notes = await this.requestService.find<NoteEntity>(NoteEntity, options);
    return _.keyBy(notes, "guid");
  }

  private async getArchiveNotes(params: IDatastoreServiceNoteFilterParams): Promise<NoteEntity[]> {
    this.progressService.next("Getting arcguve notes.");
    let options = this.makeNoteFindOptions(params);
    options.archive = true;
    options.includeContent = true;
    let notes = await this.requestService.find<NoteEntity>(NoteEntity, options);
    if (params.archiveMinStepMinute) {
      notes = _.filter(notes, (filterNote: NoteEntity) => {
        return !_.find(notes, (findNote: NoteEntity) => {
          if (filterNote.guid != findNote.guid) return false;
          if (filterNote.updateSequenceNum >= findNote.updateSequenceNum) return false;
          return (findNote.updated - filterNote.updated) < params.archiveMinStepMinute * 60 * 1000;
        });
      });
    }
    return notes;
  }

  private async getNoteContents(notes: TNotesResult): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    for (let noteGuid in notes) {
      let note = notes[noteGuid];
      this.progressService.set(`Request remote contents. ${++count} / ${_.size(notes)}`);
      if (!note.hasContent) {
        let note = await this.requestService.getNoteContent(noteGuid);
        notes[note.guid] = note;
      }
    }
  }

  private async getTimeLogs(notes: TNotesResult, params: IDatastoreServiceTimeLogFilterParams): Promise<TTimeLogsResult> {
    this.progressService.next("Getting time logs.");
    let guids: string[] = [];
    for (let noteGuid in notes) {
      var note = notes[noteGuid];
      guids.push(note.guid);
    }
    let options = this.makeTimeLogFindOptions(_.merge({}, params, {noteGuids: guids}));
    let timeLogs = await this.requestService.find<TimeLogEntity>(TimeLogEntity, options);
    let result: TTimeLogsResult = {};
    for (var timeLog of timeLogs) {
      if (!result[timeLog.noteGuid])
        result[timeLog.noteGuid] = {};
      result[timeLog.noteGuid][timeLog.id] = timeLog;
    }
    return result;
  }

  private async getProfitLogs(notes: TNotesResult): Promise<TProfitLogsResult> {
    this.progressService.next("Getting profit logs.");
    let guids: string[] = [];
    for (let noteGuid in notes) {
      let note = notes[noteGuid];
      guids.push(note.guid);
    }
    let profitLogs = await this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {where: {noteGuid: {$in: guids}}});
    let result: TProfitLogsResult = {};
    for (let profitLog of profitLogs) {
      if (!result[profitLog.noteGuid])
        result[profitLog.noteGuid] = {};
      result[profitLog.noteGuid][profitLog.id] = profitLog;
    }
    return result;
  }

  async reParse(): Promise<void> {
    this.progressService.open(2);
    this.progressService.next("Re Parse notes...");
    await this.requestService.reParseNote();
    this.progressService.next("Done.");
    this.progressService.close();
  }

  async countNotes(params: IDatastoreServiceNoteFilterParams): Promise<number> {
    let options = this.makeNoteFindOptions(params);
    return await this.requestService.count(NoteEntity, options);
  }

  async getPrevNote(archiveNotes: NoteEntity[], note: NoteEntity, minStepMinute: number): Promise<NoteEntity> {
    let prevNote: NoteEntity;
    prevNote = _.find(archiveNotes, (searchNote: NoteEntity) => {
      return searchNote.guid == note.guid && searchNote.updateSequenceNum < note.updateSequenceNum;
    });
    if (prevNote) return Promise.resolve(prevNote);
    let options: IFindNoteEntityOptions = {
      where: {
        guid: note.guid,
        updateSequenceNum: {$lt: note.updateSequenceNum},
        updated: {$lt: note.updated - minStepMinute * 60 * 1000}
      },
      archive: true,
      includeContent: true,
    };
    return await this.requestService.findOne<NoteEntity>(NoteEntity, options);
  }

  private makeNoteFindOptions(params: IDatastoreServiceNoteFilterParams): IFindNoteEntityOptions {
    let options: IFindEntityOptions<any> = {where: {$and: []}};
    if (params.start)
      (<any>options.where.$and).push({updated: {$gte: params.start.valueOf()}});
    if (params.end)
      (<any>options.where.$and).push({updated: {$lte: params.end.valueOf()}});
    // set hasContent query
    if (params.hasContent)
      (<any>options.where.$and).push({content: {$ne: null}});
    // check notebooks
    var notebooksHash: {[notebookGuid: string]: boolean} = {};
    if (params.stacks)
      for (let stack of params.stacks)
        for (let notebook of _.values(this.$vm.notebooks))
          if (notebook.stack == stack)
            notebooksHash[notebook.guid] = true;
    if (_.size(params.notebookGuids) > 0)
      for (let notebookGuid of params.notebookGuids)
        notebooksHash[notebookGuid] = true;
    // set notebooks query
    if (_.size(notebooksHash) > 0)
      (<any>options.where.$and).push({notebookGuid: {$in: _.keys(notebooksHash)}});
    return options;
  }

  private makeTimeLogFindOptions(params: IDatastoreServiceTimeLogFilterParams): IFindEntityOptions<TimeLogEntity> {
    let options: IFindEntityOptions<any> = {where: {$and: []}};
    // set date query
    if (params.start)
      (<any>options.where.$and).push({date: {$gte: params.start.valueOf()}});
    if (params.end)
      (<any>options.where.$and).push({date: {$lte: params.end.valueOf()}});
    // set note guids query
    if (params.noteGuids)
      if (params.noteGuids.length > 0)
        _.merge(options.where, {noteGuid: {$in: params.noteGuids}});
    return options;
  }

}
