import _ = require("lodash");
import {injectable} from "inversify";
import moment = require("moment");
import {Evernote} from "evernote";
import  Vue from "vue";
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
import {configLoader, IPersonConfig} from "../../common/util/config-loader";

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

@Component({})
export class DatastoreServiceEventBus extends Vue {
  lastUpdateCount: number = 0;
  user: Evernote.User = null;
  currentPersonId: number = 0;
  notebooks: {[guid: string]: NotebookEntity} = {};
  stacks: string[] = [];
  tags: {[guid: string]: TagEntity} = {};
  notes: {[guid: string]: NoteEntity} = {};
  noteArchives: NoteEntity[] = [];
  timeLogs: {[noteGuid: string]: {[_id: string]: TimeLogEntity}} = {};
  profitLogs: {[noteGuid: string]: {[_id: string]: ProfitLogEntity}} = {};
  filterParams: {notebookGuids?: string[], stacks?: string[]} = {};
}

@injectable()
export class DatastoreService extends BaseClientService {

  $vm = new DatastoreServiceEventBus();

  constructor(protected requestService: RequestService,
              protected progressService: ProgressService) {
    super();
  }

  get currentPerson(): IPersonConfig {
    return _.find(configLoader.app.persons, {id: this.$vm.currentPersonId});
  }

  async initialize(): Promise<void> {
    this.$vm.user = await this.requestService.loadOption("user");
    this.$vm.currentPersonId = _.toInteger(await this.requestService.loadSession("currentPersonId"));
  }

  async reload(params: IDatastoreServiceParams = {}): Promise<void> {
    if (this.progressService.isActive) return;
    this.progressService.open(params.getContent ? 9 : params.archive ? 6 : 3);
    try {
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
        throw err;
    }
    this.progressService.close();
  }

  private async runSync(): Promise<void> {
    this.progressService.next("Syncing remote server.");
    await this.requestService.sync();
  }

  private async getNotebooks(): Promise<void> {
    this.progressService.next("Getting notebooks data.");
    let notebooks = await this.requestService.find<NotebookEntity>(NotebookEntity);
    this.$vm.notebooks = _.keyBy(notebooks, "guid");
    this.$vm.stacks = _(notebooks).map<string>("stack").uniq().value();
  }

  private async getTags(): Promise<void> {
    this.progressService.next("Getting tags data.");
    let tags = await this.requestService.find<TagEntity>(TagEntity);
    this.$vm.tags = _.keyBy(tags, "guid");
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
    this.$vm.noteArchives = notes;
    this.$vm.notes = _.keyBy(notes, "guid");
  }

  private async getNoteContents(): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    for (let noteGuid in this.$vm.notes) {
      let note = this.$vm.notes[noteGuid];
      this.progressService.set(`Request remote contents. ${++count} / ${_.size(this.$vm.notes)}`);
      if (!note.hasContent) {
        let note = await this.requestService.getNoteContent(noteGuid);
        this.$vm.notes[note.guid] = note;
      }
    }
  }

  private async getTimeLogs(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Getting time logs.");
    let guids: string[] = [];
    for (let noteGuid in this.$vm.notes) {
      var note = this.$vm.notes[noteGuid];
      guids.push(note.guid);
    }
    let options = this.makeTimeLogFindOptions(_.merge({}, params, {noteGuids: guids}));
    let timeLogs = await this.requestService.find<TimeLogEntity>(TimeLogEntity, options);
    this.$vm.timeLogs = {};
    for (var timeLog of timeLogs) {
      if (!this.$vm.timeLogs[timeLog.noteGuid])
        this.$vm.timeLogs[timeLog.noteGuid] = {};
      this.$vm.timeLogs[timeLog.noteGuid][timeLog.id] = timeLog;
    }
  }

  private async getProfitLogs(): Promise<void> {
    this.progressService.next("Getting profit logs.");
    let guids: string[] = [];
    for (let noteGuid in this.$vm.notes) {
      let note = this.$vm.notes[noteGuid];
      guids.push(note.guid);
    }
    let profitLogs = await this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {where: {noteGuid: {$in: guids}}});
    this.$vm.profitLogs = {};
    for (let profitLog of profitLogs) {
      if (!this.$vm.profitLogs[profitLog.noteGuid])
        this.$vm.profitLogs[profitLog.noteGuid] = {};
      this.$vm.profitLogs[profitLog.noteGuid][profitLog.id] = profitLog;
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
    prevNote = _.find(this.$vm.noteArchives, (searchNote: NoteEntity) => {
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

  private makeNoteFindOptions(params: IDatastoreServiceParams): IFindNoteEntityOptions {
    let options: IFindNoteEntityOptions = {where: {$and: []}};
    if (params.start)
      (<any>options.where.$and).push({updated: {$gte: params.start.valueOf()}});
    if (params.end)
      (<any>options.where.$and).push({updated: {$lte: params.end.valueOf()}});
    // set hasContent query
    if (params.hasContent)
      (<any>options.where.$and).push({content: {$ne: null}});
    // set noFilter
    if (!params.noFilter) {
      // check notebooks
      var notebooksHash: {[notebookGuid: string]: boolean} = {};
      if (this.$vm.filterParams.notebookGuids && this.$vm.filterParams.notebookGuids.length > 0)
        for (var notebookGuid of this.$vm.filterParams.notebookGuids)
          notebooksHash[notebookGuid] = true;
      // set notebooks query
      if (_.size(notebooksHash) > 0)
        (<any>options.where.$and).push({notebookGuid: {$in: _.keys(notebooksHash)}});
    }
    if (params.archive) {
      options.archive = true;
      options.includeContent = true;
    }
    return options;
  }

  private makeTimeLogFindOptions(params: IDatastoreServiceParams): IFindEntityOptions {
    let options: IFindEntityOptions = {where: {$and: []}};
    // set date query
    if (params.start)
      (<any>options.where.$and).push({date: {$gte: params.start.valueOf()}});
    if (params.end)
      (<any>options.where.$and).push({date: {$lte: params.end.valueOf()}});
    // set noFilter query
    if (params.noFilter) {
    }
    // set note guids query
    if (params.noteGuids)
      if (params.noteGuids.length > 0)
        _.merge(options.where, {noteGuid: {$in: params.noteGuids}});
    return options;
  }

}
