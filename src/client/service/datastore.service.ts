import _ from "lodash";

import NoteEntity, {
  IFindManyNoteEntityOptions,
} from "~/src/common/entity/note.entity";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import BaseClientService from "~/src/client/service/base-client.service";
import RequestService from "~/src/client/service/request.service";
import SocketIoClientService from "~/src/client/service/socket-io-client.service";
import configLoader from "~/src/common/util/config-loader";
import { logger } from "~/src/client/plugins/logger";
import {
  FindManyEntityOptions,
  FindEntityWhereOptions,
} from "~/src/common/entity/base.entity";
import { assertIsDefined } from "~/src/common/util/assert";
import { myStore } from "~/src/client/store";
import {
  IDatastoreServiceNoteFilterParams,
  IDatastoreServiceTimeLogFilterParams,
  INoteLogsResult,
  TerminateResult,
  TNotesResult,
  TProfitLogsResult,
  TTimeLogsResult,
} from "~/src/client/store/datastore";

export default class DatastoreService extends BaseClientService {
  constructor(
    protected requestService: RequestService,
    protected socketIoClientService: SocketIoClientService
  ) {
    super();
  }

  async initialize(): Promise<void> {
    this.socketIoClientService.on(
      this,
      "sync::updateNotebooks",
      this.syncNotebooks
    );
    this.socketIoClientService.on(this, "sync::updateTags", this.syncTags);
    myStore.datastore.setUser(await this.requestService.loadOption("user"));
    myStore.datastore.setCurrentPersonId(
      _.toInteger(await this.requestService.loadSession("currentPersonId"))
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
      .map(
        (notebookName: string) => myStore.datastore.notebooks[notebookName].guid
      )
      .filter(_.isString)
      .value();
    return result;
  }

  private async syncNotebooks(): Promise<void> {
    logger.debug(`Synchronizing notebooks.`);
    const notebooks = await this.requestService.find<NotebookEntity>(
      NotebookEntity
    );
    myStore.datastore.setNotebooks(_.keyBy(notebooks, "guid"));
    myStore.datastore.setStacks(
      _(notebooks)
        .map("stack")
        .uniq()
        .filter(_.isString)
        .value()
    );
  }

  private async syncTags(): Promise<void> {
    logger.debug(`Synchronizing tags.`);
    const tags = await this.requestService.find<TagEntity>(TagEntity);
    myStore.datastore.setTags(_.keyBy(tags, "guid"));
  }

  async getNoteLogs(
    params: IDatastoreServiceNoteFilterParams = {}
  ): Promise<INoteLogsResult | null> {
    if (myStore.progress.isActive) return null;
    const result: INoteLogsResult = {
      notes: null,
      timeLogs: null,
      profitLogs: null,
    };
    myStore.progress.open(7);
    try {
      await this.runSync();
      await this.checkNoteCount(params);
      result.notes = await this.getNotes(params);
      await this.getNoteContents(result.notes);
      result.timeLogs = await this.getTimeLogs(result.notes, params);
      result.profitLogs = await this.getProfitLogs(result.notes);
      myStore.progress.next("Done.");
    } catch (err) {
      alert(err);
      if (!(err instanceof TerminateResult)) throw err;
    } finally {
      myStore.progress.close();
    }
    return result;
  }

  async getArchiveLogs(
    params: IDatastoreServiceNoteFilterParams = {}
  ): Promise<NoteEntity[] | null> {
    if (myStore.progress.isActive) return null;
    myStore.progress.open(4);
    let archiveNotes;
    try {
      await this.runSync();
      await this.checkNoteCount(params);
      archiveNotes = await this.getArchiveNotes(params);
      myStore.progress.next("Done.");
    } catch (err) {
      alert(err);
      if (!(err instanceof TerminateResult)) throw err;
    } finally {
      myStore.progress.close();
    }
    return archiveNotes ?? null;
  }

  private async runSync(): Promise<void> {
    myStore.progress.next("Syncing remote server.");
    await this.requestService.sync();
  }

  private async checkNoteCount(
    params: IDatastoreServiceNoteFilterParams
  ): Promise<void> {
    myStore.progress.next("Checking notes count.");
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
    myStore.progress.next("Getting notes.");
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
    myStore.progress.next("Getting arcguve notes.");
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
    myStore.progress.next("Request remote contents.");
    let count = 0;
    for (const noteGuid in notes) {
      const note = notes[noteGuid];
      myStore.progress.set({
        message: `Request remote contents. ${++count} / ${_.size(notes)}`,
      });
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
    myStore.progress.next("Getting time logs.");
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
    myStore.progress.next("Getting profit logs.");
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
    myStore.progress.open(2);
    myStore.progress.next("Re Parse notes...");
    await this.requestService.reParseNote();
    myStore.progress.next("Done.");
    myStore.progress.close();
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
    const where: FindEntityWhereOptions<NoteEntity> = {};
    if (params.start && params.end)
      where.updated = {
        $between: [params.start.valueOf(), params.end.valueOf()],
      };
    else if (params.start) where.updated = { $gte: params.start.valueOf() };
    else if (params.end) where.updated = { $lte: params.end.valueOf() };
    // set hasContent query
    if (params.hasContent) where.content = { $ne: null };
    // check notebooks
    const notebooksHash: { [notebookGuid: string]: boolean } = {};
    if (params.stacks)
      for (const stack of params.stacks)
        for (const notebook of _.values(myStore.datastore.notebooks))
          if (notebook.stack === stack) notebooksHash[notebook.guid] = true;
    if (_.size(params.notebookGuids) > 0)
      for (const notebookGuid of params.notebookGuids ?? [])
        notebooksHash[notebookGuid] = true;
    // set notebooks query
    if (_.size(notebooksHash) > 0)
      where.notebookGuid = { $in: _.keys(notebooksHash) };
    return { where };
  }

  private makeTimeLogFindOptions(
    params: IDatastoreServiceTimeLogFilterParams
  ): FindManyEntityOptions<TimeLogEntity> {
    const where: FindEntityWhereOptions<TimeLogEntity> = {};
    // set date query
    if (params.start && params.end)
      where.date = { $between: [params.start.valueOf(), params.end.valueOf()] };
    else if (params.start) where.date = { $gte: params.start.valueOf() };
    else if (params.end) where.date = { $lte: params.end.valueOf() };
    // set note guids query
    if (params.noteGuids && params.noteGuids.length > 0)
      where.noteGuid = { $in: params.noteGuids };
    return { where };
  }
}
