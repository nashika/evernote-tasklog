import _ from "lodash";
import moment from "moment";

import { injectable } from "inversify";
import {
  IFindManyNoteEntityOptions,
  NoteEntity,
} from "~/src/common/entity/note.entity";
import { TimeLogEntity } from "~/src/common/entity/time-log.entity";
import { ProfitLogEntity } from "~/src/common/entity/profit-log.entity";
import { BaseClientService } from "~/src/client/service/base-client.service";
import { RequestService } from "~/src/client/service/request.service";
import {
  FindManyEntityOptions,
  FindEntityWhereOptions,
} from "~/src/common/entity/base.entity";
import { assertIsDefined } from "~/src/common/util/assert";
import { myStore } from "~/src/client/store";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

export interface INoteLogsServiceNoteFilterParams {
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

class TerminateResult {
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

interface INoteLogsResult {
  notes: TNotesResult | null;
  timeLogs: TTimeLogsResult | null;
  profitLogs: TProfitLogsResult | null;
}

@injectable()
export class NoteLogsService extends BaseClientService {
  constructor(protected requestService: RequestService) {
    super();
  }

  makeDefaultNoteFilterParams(
    params: AppConfig.IDefaultFilterParamsConfig
  ): INoteLogsServiceNoteFilterParams {
    const result: INoteLogsServiceNoteFilterParams = {};
    result.stacks = params.stacks || [];
    result.notebookGuids = _(params.notebooks || [])
      .map(
        (notebookName: string) => myStore.datastore.notebooks[notebookName].guid
      )
      .filter(_.isString)
      .value();
    return result;
  }

  async getNoteLogs(
    params: INoteLogsServiceNoteFilterParams = {}
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
    params: INoteLogsServiceNoteFilterParams = {}
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
    params: INoteLogsServiceNoteFilterParams
  ): Promise<void> {
    myStore.progress.next("Checking notes count.");
    const options = this.makeNoteFindOptions(params);
    const count = await this.requestService.count(NoteEntity, options);
    if (count > appConfigLoader.app.warningNoteCount)
      if (
        !window.confirm(
          `Current query find ${count} notes. It is too many. Continue anyway?`
        )
      )
        throw new TerminateResult(`User Canceled`);
  }

  protected async getNotes(
    params: INoteLogsServiceNoteFilterParams
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
    params: INoteLogsServiceNoteFilterParams
  ): Promise<NoteEntity[]> {
    myStore.progress.next("ノート履歴を取得しています.");
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

  async countNotes(params: INoteLogsServiceNoteFilterParams): Promise<number> {
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
    params: INoteLogsServiceNoteFilterParams
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
