import { injectable } from "inversify";
import Vue from "vue";
import Component from "vue-class-component";
import _ from "lodash";
import moment from "moment";
import Evernote from "evernote";

import NoteEntity from "~/src/common/entity/note.entity";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import BaseClientService from "~/src/client/plugins/service/base-client.service";
import RequestService from "~/src/client/plugins/service/request.service";
import ProgressService from "~/src/client/plugins/service/progress.service";
import SocketIoClientService from "~/src/client/plugins/service/socket-io-client.service";
import configLoader from "~/src/common/util/config-loader";
import logger from "~/src/client/plugins/logger";
import { IFindManyNoteEntityOptions } from "~/src/server/table/note.table";
import { IFindManyEntityOptions } from "~/src/common/entity/base.entity";
import { assertIsDefined } from "~/src/common/util/assert";

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
  data: any;
  constructor(argData: any = null) {
    this.data = argData;
  }

  toString(): string {
    return this.data;
  }
}

export type TNotesResult = { [guid: string]: NoteEntity };
export type TTimeLogsResult = {
  [noteGuid: string]: { [id: number]: TimeLogEntity };
};
export type TProfitLogsResult = {
  [noteGuid: string]: { [id: number]: ProfitLogEntity };
};

export interface INoteLogsResult {
  notes: TNotesResult | null;
  timeLogs: TTimeLogsResult | null;
  profitLogs: TProfitLogsResult | null;
}

@Component({})
export class DatastoreServiceEventBus extends Vue {
  lastUpdateCount: number = 0;
  user: Evernote.Types.User | null = null;
  currentPersonId: number = 0;
  notebooks: { [guid: string]: NotebookEntity } = {};
  stacks: string[] = [];
  tags: { [guid: string]: TagEntity } = {};
}

@injectable()
export class DatastoreService extends BaseClientService {
  $vm = new DatastoreServiceEventBus();

  constructor(
    protected requestService: RequestService,
    protected progressService: ProgressService,
    protected socketIoClientService: SocketIoClientService
  ) {
    super();
  }

  get currentPerson(): AppConfig.IPersonConfig | null {
    return (
      _.find(configLoader.app.persons, { id: this.$vm.currentPersonId }) ?? null
    );
  }

  async initialize(): Promise<void> {
    this.socketIoClientService.on(
      this,
      "sync::updateNotebooks",
      this.syncNotebooks
    );
    this.socketIoClientService.on(this, "sync::updateTags", this.syncTags);
    this.$vm.user = await this.requestService.loadOption("user");
    this.$vm.currentPersonId = _.toInteger(
      await this.requestService.loadSession("currentPersonId")
    );
    await this.syncNotebooks();
    await this.syncTags();
  }

  makeDefaultNoteFilterParams(
    params: AppConfig.IDefaultFilterParamsConfig
  ): IDatastoreServiceNoteFilterParams {
    const result: IDatastoreServiceNoteFilterParams = {};
    result.stacks = params.stacks || [];
    result.notebookGuids = _(params.notebooks || [])
      .map((notebookName: string) => this.$vm.notebooks[notebookName].guid)
      .filter(_.isString)
      .value();
    return result;
  }

  private async syncNotebooks(): Promise<void> {
    logger.debug(`Synchronizing notebooks.`);
    const notebooks = await this.requestService.find<NotebookEntity>(
      NotebookEntity
    );
    this.$vm.notebooks = _.keyBy(notebooks, "guid");
    this.$vm.stacks = _(notebooks)
      .map("stack")
      .uniq()
      .filter(_.isString)
      .value();
  }

  private async syncTags(): Promise<void> {
    logger.debug(`Synchronizing tags.`);
    const tags = await this.requestService.find<TagEntity>(TagEntity);
    this.$vm.tags = _.keyBy(tags, "guid");
  }

  async getNoteLogs(
    params: IDatastoreServiceNoteFilterParams = {}
  ): Promise<INoteLogsResult | null> {
    if (this.progressService.isActive) return null;
    const result: INoteLogsResult = {
      notes: null,
      timeLogs: null,
      profitLogs: null,
    };
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

  async getArchiveLogs(
    params: IDatastoreServiceNoteFilterParams = {}
  ): Promise<NoteEntity[] | null> {
    if (this.progressService.isActive) return null;
    this.progressService.open(4);
    let archiveNotes;
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
    return archiveNotes ?? null;
  }

  private async runSync(): Promise<void> {
    this.progressService.next("Syncing remote server.");
    await this.requestService.sync();
  }

  private async checkNoteCount(
    params: IDatastoreServiceNoteFilterParams
  ): Promise<void> {
    this.progressService.next("Checking notes count.");
    const options = this.makeNoteFindOptions(params);
    const count = await this.requestService.count(NoteEntity, options);
    if (count > configLoader.app.warningNoteCount)
      if (
        !window.confirm(
          `Current query find ${count} notes. It is too many. Continue anyway?`
        )
      )
        throw new TerminateResult(`User Canceled`);
  }

  protected async getNotes(
    params: IDatastoreServiceNoteFilterParams
  ): Promise<TNotesResult> {
    this.progressService.next("Getting notes.");
    const options = this.makeNoteFindOptions(params);
    const notes = await this.requestService.find<NoteEntity>(
      NoteEntity,
      options
    );
    return _.keyBy(notes, "guid");
  }

  private async getArchiveNotes(
    params: IDatastoreServiceNoteFilterParams
  ): Promise<NoteEntity[]> {
    this.progressService.next("Getting arcguve notes.");
    const options = this.makeNoteFindOptions(params);
    options.archive = true;
    options.includeContent = true;
    let notes = await this.requestService.find<NoteEntity>(NoteEntity, options);
    if (params.archiveMinStepMinute) {
      notes = _.filter(notes, (filterNote: NoteEntity) => {
        return !_.find(notes, (findNote: NoteEntity) => {
          if (filterNote.guid !== findNote.guid) return false;
          if (filterNote.updateSequenceNum >= findNote.updateSequenceNum)
            return false;
          return (
            findNote.updated - filterNote.updated <
            (params.archiveMinStepMinute ?? 0) * 60 * 1000
          );
        });
      });
    }
    return notes;
  }

  private async getNoteContents(notes: TNotesResult): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    for (const noteGuid in notes) {
      const note = notes[noteGuid];
      this.progressService.set(
        `Request remote contents. ${++count} / ${_.size(notes)}`
      );
      if (!note.hasContent) {
        const note = await this.requestService.getNoteContent(noteGuid);
        assertIsDefined(note);
        notes[note.guid] = note;
      }
    }
  }

  private async getTimeLogs(
    notes: TNotesResult,
    params: IDatastoreServiceTimeLogFilterParams
  ): Promise<TTimeLogsResult> {
    this.progressService.next("Getting time logs.");
    const guids: string[] = [];
    for (const noteGuid in notes) {
      const note = notes[noteGuid];
      guids.push(note.guid);
    }
    const options = this.makeTimeLogFindOptions(
      _.merge({}, params, { noteGuids: guids })
    );
    const timeLogs = await this.requestService.find<TimeLogEntity>(
      TimeLogEntity,
      options
    );
    const result: TTimeLogsResult = {};
    for (const timeLog of timeLogs) {
      if (!result[timeLog.noteGuid]) result[timeLog.noteGuid] = {};
      result[timeLog.noteGuid][timeLog.id] = timeLog;
    }
    return result;
  }

  private async getProfitLogs(notes: TNotesResult): Promise<TProfitLogsResult> {
    this.progressService.next("Getting profit logs.");
    const guids: string[] = [];
    for (const noteGuid in notes) {
      const note = notes[noteGuid];
      guids.push(note.guid);
    }
    const profitLogs = await this.requestService.find<ProfitLogEntity>(
      ProfitLogEntity,
      { where: { noteGuid: { $in: guids } } }
    );
    const result: TProfitLogsResult = {};
    for (const profitLog of profitLogs) {
      if (!result[profitLog.noteGuid]) result[profitLog.noteGuid] = {};
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
    const options = this.makeNoteFindOptions(params);
    return this.requestService.count(NoteEntity, options);
  }

  async getPrevNote(
    archiveNotes: NoteEntity[],
    note: NoteEntity,
    minStepMinute: number
  ): Promise<NoteEntity> {
    const prevNote: NoteEntity | undefined = _.find(
      archiveNotes,
      (searchNote: NoteEntity) => {
        return (
          searchNote.guid === note.guid &&
          searchNote.updateSequenceNum < note.updateSequenceNum
        );
      }
    );
    if (prevNote) return Promise.resolve(prevNote);
    const options: IFindManyNoteEntityOptions = {
      where: {
        guid: note.guid,
        updateSequenceNum: { $lt: note.updateSequenceNum },
        updated: { $lt: note.updated - minStepMinute * 60 * 1000 },
      },
      archive: true,
      includeContent: true,
    };
    return this.requestService.findOne<NoteEntity>(NoteEntity, options);
  }

  private makeNoteFindOptions(
    params: IDatastoreServiceNoteFilterParams
  ): IFindManyNoteEntityOptions {
    const options: IFindManyEntityOptions<any> = { where: { $and: [] } };
    if (params.start)
      (<any>options.where.$and).push({
        updated: { $gte: params.start.valueOf() },
      });
    if (params.end)
      (<any>options.where.$and).push({
        updated: { $lte: params.end.valueOf() },
      });
    // set hasContent query
    if (params.hasContent)
      (<any>options.where.$and).push({ content: { $ne: null } });
    // check notebooks
    const notebooksHash: { [notebookGuid: string]: boolean } = {};
    if (params.stacks)
      for (const stack of params.stacks)
        for (const notebook of _.values(this.$vm.notebooks))
          if (notebook.stack === stack) notebooksHash[notebook.guid] = true;
    if (_.size(params.notebookGuids) > 0)
      for (const notebookGuid of params.notebookGuids)
        notebooksHash[notebookGuid] = true;
    // set notebooks query
    if (_.size(notebooksHash) > 0)
      (<any>options.where.$and).push({
        notebookGuid: { $in: _.keys(notebooksHash) },
      });
    return options;
  }

  private makeTimeLogFindOptions(
    params: IDatastoreServiceTimeLogFilterParams
  ): IFindManyEntityOptions<TimeLogEntity> {
    const options: IFindManyEntityOptions<any> = { where: { $and: [] } };
    // set date query
    if (params.start)
      (<any>options.where.$and).push({
        date: { $gte: params.start.valueOf() },
      });
    if (params.end)
      (<any>options.where.$and).push({ date: { $lte: params.end.valueOf() } });
    // set note guids query
    if (params.noteGuids)
      if (params.noteGuids.length > 0)
        _.merge(options.where, { noteGuid: { $in: params.noteGuids } });
    return options;
  }
}
