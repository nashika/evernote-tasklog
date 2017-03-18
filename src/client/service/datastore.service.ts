import _ = require("lodash");
import {injectable} from "inversify";
import moment = require("moment");

import {NoteEntity, INoteEntityFindOptions} from "../../common/entity/note.entity";
import {UserEntity} from "../../common/entity/user.entity";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseClientService} from "./base-client.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {ProgressService} from "./progress.service";
import {RequestService} from "./request.service";
import {SettingEntity} from "../../common/entity/setting.entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {TagEntity} from "../../common/entity/tag.entity";

interface IDatastoreServiceParams {
  start?: moment.Moment,
  end?: moment.Moment,
  noteGuids?: string[],
  hasContent?: boolean,
  noFilter?: boolean,
  getContent?: boolean,
  archive?: boolean
  archiveMinStepMinute?: number;
}

export class TerminateResult {

  constructor(public data: any = null) {
  }

  toString(): string {
    return this.data;
  }

}

@injectable()
export class DatastoreService extends BaseClientService {

  lastUpdateCount: number;
  globalUser: GlobalUserEntity;
  user: UserEntity;
  persons: Object[];
  notebooks: {[guid: string]: NotebookEntity};
  stacks: string[];
  tags: {[guid: string]: TagEntity};
  notes: {[guid: string]: NoteEntity};
  noteArchives: NoteEntity[];
  timeLogs: {[noteGuid: string]: {[_id: string]: TimeLogEntity}};
  profitLogs: {[noteGuid: string]: {[_id: string]: ProfitLogEntity}};
  settings: {[key: string]: any};
  filterParams: {notebookGuids: string[]} = null;

  constructor(protected requestService: RequestService,
              protected progressService: ProgressService) {
    super();
    this.lastUpdateCount = 0;
    this.globalUser = null;
    this.user = null;
    this.filterParams = {
      notebookGuids: [],
    };
    this.clear();
  }

  async initialize(): Promise<void> {
    this.globalUser = await this.requestService.loadAuth();
  }

  async changeUser(globalUser: GlobalUserEntity): Promise<void> {
    await this.requestService.changeAuth(globalUser);
    this.globalUser = await this.requestService.loadAuth();
    this.clear();
  }

  clear(): void {
    this.lastUpdateCount = 0;
    this.persons = [];
    this.notebooks = {};
    this.stacks = [];
    this.tags = {};
    this.notes = {};
    this.noteArchives = [];
    this.timeLogs = {};
    this.profitLogs = {};
    this.settings = {};
  }

  async checkUpdateCount(): Promise<boolean> {
    let updateCount = await this.requestService.getUpdateCount();
    if (this.lastUpdateCount == updateCount)
      return false;
    this.lastUpdateCount = updateCount;
    return true;
  }

  async reload(params: IDatastoreServiceParams = {}): Promise<void> {
    if (!this.globalUser) return;
    if (this.progressService.isActive) return;
    this.progressService.open(params.getContent ? 12 : params.archive ? 9 : 7);
    try {
      await this.getUser();
      await this.getSettings();
      await this.checkSettings();
      await this.runSync();
      await this.getNotebooks();
      await this.getTags();
      if (params.getContent) {
        await this.checkNoteCount(params);
        await this.getNotes(params);
        await this.getNoteContents();
        await this.getTimeLogs(params);
        await this.getProfitLogs();
      } else if (params.archive) {
        await this.checkNoteCount(params);
        await this.getNotes(params);
      }
      this.progressService.next("Done.");
    } catch (err) {
      alert(err);
      this.progressService.close();
      if (!(err instanceof TerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
    }
    this.progressService.close();
  }

  private async getUser(): Promise<void> {
    this.progressService.next("Getting user data.");
    if (this.user) return;
    this.user = await this.requestService.load<UserEntity>(UserEntity);
  }

  private async getSettings(): Promise<void> {
    this.progressService.next("Getting settings data.");
    let settings = await this.requestService.find<SettingEntity>(SettingEntity);
    let result: {[key: string]: any} = {};
    for (let setting of settings) result[setting._id] = setting.value;
    this.settings = result;
  }

  private async checkSettings(): Promise<void> {
    this.progressService.next("Checking settings data.");
    if (!this.settings["persons"] || this.settings["persons"].length == 0)
      throw new TerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`);
  }

  private async runSync(): Promise<void> {
    this.progressService.next("Syncing remote server.");
    await this.requestService.sync();
  }

  private async getNotebooks(): Promise<void> {
    this.progressService.next("Getting notebooks data.");
    let notebooks = await this.requestService.find<NotebookEntity>(NotebookEntity);
    this.notebooks = _.keyBy(notebooks, "guid");
    this.stacks = _(notebooks).map<string>("stack").uniq().value();
  }

  private async getTags(): Promise<void> {
    this.progressService.next("Getting tags data.");
    let tags = await this.requestService.find<TagEntity>(TagEntity);
    this.tags = _.keyBy(tags, "guid");
  }

  private async checkNoteCount(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Checking notes count.");
    let options = this.makeNoteFindOptions(params);
    let count = await this.requestService.count(NoteEntity, options);
    if (count > 100)
      if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
        throw new TerminateResult(`User Canceled`);
  }

  private async getNotes(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Getting notes.");
    let options = this.makeNoteFindOptions(params);
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
    this.noteArchives = notes;
    this.notes = _.keyBy(notes, "guid");
  }

  private async getNoteContents(): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    for (let noteGuid in this.notes) {
      let note = this.notes[noteGuid];
      this.progressService.set(`Request remote contents. ${++count} / ${_.size(this.notes)}`);
      if (!note.hasContent) {
        let note = await this.requestService.getNoteContent(noteGuid);
        this.notes[note.guid] = note;
      }
    }
  }

  private async getTimeLogs(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Getting time logs.");
    let guids: string[] = [];
    for (let noteGuid in this.notes) {
      var note = this.notes[noteGuid];
      guids.push(note.guid);
    }
    let options = this.makeTimeLogFindOptions(_.merge({}, params, {noteGuids: guids}));
    let timeLogs = await this.requestService.find<TimeLogEntity>(TimeLogEntity, options);
    this.timeLogs = {};
    for (var timeLog of timeLogs) {
      if (!this.timeLogs[timeLog.noteGuid])
        this.timeLogs[timeLog.noteGuid] = {};
      this.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
    }
  }

  private async getProfitLogs(): Promise<void> {
    this.progressService.next("Getting profit logs.");
    let guids: string[] = [];
    for (let noteGuid in this.notes) {
      let note = this.notes[noteGuid];
      guids.push(note.guid);
    }
    let profitLogs = await this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {query: {noteGuid: {$in: guids}}});
    this.profitLogs = {};
    for (let profitLog of profitLogs) {
      if (!this.profitLogs[profitLog.noteGuid])
        this.profitLogs[profitLog.noteGuid] = {};
      this.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
    }
  }

  async reParse(): Promise<void> {
    this.progressService.open(2);
    this.progressService.next("Re Parse notes...");
    await this.requestService.reParseNote();
    this.progressService.next("Done.");
    this.progressService.close();
  }

  async countNotes(params: IDatastoreServiceParams): Promise<number> {
    let options = this.makeNoteFindOptions(params);
    return await this.requestService.count(NoteEntity, options);
  }

  async countTimeLogs(params: IDatastoreServiceParams): Promise<number> {
    let options = this.makeTimeLogFindOptions(params);
    return await this.requestService.count(TimeLogEntity, options);
  }

  async getPrevNote(note: NoteEntity, minStepMinute: number): Promise<NoteEntity> {
    let prevNote: NoteEntity;
    prevNote = _.find(this.noteArchives, (searchNote: NoteEntity) => {
      return searchNote.guid == note.guid && searchNote.updateSequenceNum < note.updateSequenceNum;
    });
    if (prevNote) return Promise.resolve(prevNote);
    let options: INoteEntityFindOptions = {
      query: {guid: note.guid, updateSequenceNum: {$lt: note.updateSequenceNum}, updated: {$lt: note.updated - minStepMinute * 60 * 1000}},
      archive: true,
      content: true,
    };
    return await this.requestService.findOne<NoteEntity>(NoteEntity, options);
  }

  private makeNoteFindOptions(params: IDatastoreServiceParams): IMultiEntityFindOptions {
    let options: INoteEntityFindOptions = {query: {$and: []}};
    if (params.start)
      options.query.$and.push({updated: {$gte: params.start.valueOf()}});
    if (params.end)
      options.query.$and.push({updated: {$lte: params.end.valueOf()}});
    // set hasContent query
    if (params.hasContent)
      options.query.$and.push({content: {$ne: null}});
    // set noFilter
    if (!params.noFilter) {
      // check notebooks
      var notebooksHash: {[notebookGuid: string]: boolean} = {};
      if (this.filterParams.notebookGuids && this.filterParams.notebookGuids.length > 0)
        for (var notebookGuid of this.filterParams.notebookGuids)
          notebooksHash[notebookGuid] = true;
      // set notebooks query
      if (_.size(notebooksHash) > 0)
        options.query.$and.push({notebookGuid: {$in: _.keys(notebooksHash)}});
    }
    if (params.archive) {
      options.archive = true;
      options.content = true;
    }
    return options;
  }

  private makeTimeLogFindOptions(params: IDatastoreServiceParams): IMultiEntityFindOptions {
    let options:IMultiEntityFindOptions = {query: {$and: []}};
    // set date query
    if (params.start)
      options.query.$and.push({date: {$gte: params.start.valueOf()}});
    if (params.end)
      options.query.$and.push({date: {$lte: params.end.valueOf()}});
    // set noFilter query
    if (params.noFilter) {
    }
    // set note guids query
    if (params.noteGuids)
      if (params.noteGuids.length > 0)
        _.merge(options.query, {noteGuid: {$in: params.noteGuids}});
    return options;
  }

}
