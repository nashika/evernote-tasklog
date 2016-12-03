import _ = require("lodash");
import {injectable} from "inversify";

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
import {MyPromise} from "../../common/util/my-promise";
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
  filterParams: {notebookGuids: string[], stacks: string[]} = null;

  constructor(protected requestService: RequestService,
              protected progressService: ProgressService) {
    super();
    this.lastUpdateCount = 0;
    this.globalUser = null;
    this.user = null;
    this.filterParams = {
      notebookGuids: [],
      stacks: [],
    };
    this.clear();
  }

  clear(): void {
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

  checkUpdateCount(): Promise<boolean> {
    return this.requestService.getUpdateCount().then(updateCount => {
      if (this.lastUpdateCount == updateCount)
        return false;
      this.lastUpdateCount = updateCount;
      return true;
    });
  }

  reload(params: IDatastoreServiceParams = {}): Promise<void> {
    if (!this.globalUser) return Promise.resolve();
    this.progressService.open(params.getContent ? 12 : params.archive ? 9 : 7);
    return Promise.resolve().then(() => {
      return this.getUser();
    }).then(() => {
      return this.getSettings();
    }).then(() => {
      return this.checkSettings();
    }).then(() => {
      return this.runSync();
    }).then(() => {
      return this.getNotebooks();
    }).then(() => {
      return this.getTags();
    }).then(() => {
      if (params.getContent) {
        return Promise.resolve().then(() => {
          return this.checkNoteCount(params);
        }).then(() => {
          return this.getNotes(params);
        }).then(() => {
          return this.getNoteContents();
        }).then(() => {
          return this.getTimeLogs(params);
        }).then(() => {
          return this.getProfitLogs();
        });
      } else if (params.archive) {
        return Promise.resolve().then(() => {
          return this.checkNoteCount(params);
        }).then(() => {
          return this.getNotes(params);
        });
      } else {
        return Promise.resolve();
      }
    }).then(() => {
      this.progressService.next("Done.");
      this.progressService.close();
    }).catch(err => {
      alert(err);
      this.progressService.close();
      if (!(err instanceof TerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
    });
  }

  private getUser(): Promise<void> {
    this.progressService.next("Getting user data.");
    if (this.user) return Promise.resolve();
    return this.requestService.load<UserEntity>(UserEntity).then(user => {
      this.user = user;
    });
  }

  private getSettings(): Promise<void> {
    this.progressService.next("Getting settings data.");
    return this.requestService.find<SettingEntity>(SettingEntity).then(settings => {
      let result: {[key: string]: any} = {};
      for (let setting of settings) result[setting._id] = setting.value;
      this.settings = result;
    });
  }

  private checkSettings(): Promise<void> {
    this.progressService.next("Checking settings data.");
    if (!this.settings["persons"] || this.settings["persons"].length == 0)
      return Promise.reject(new TerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
    else
      return Promise.resolve();
  }

  private runSync(): Promise<void> {
    this.progressService.next("Syncing remote server.");
    return this.requestService.sync();
  }

  private getNotebooks(): Promise<void> {
    this.progressService.next("Getting notebooks data.");
    return this.requestService.find<NotebookEntity>(NotebookEntity).then(notebooks => {
      this.notebooks = _.keyBy(notebooks, "guid");
      this.stacks = _(notebooks).map<string>("stack").uniq().value();
    });
  }

  private getTags(): Promise<void> {
    this.progressService.next("Getting tags data.");
    return this.requestService.find<TagEntity>(TagEntity).then(tags => {
      this.tags = _.keyBy(tags, "guid");
    });
  }

  private checkNoteCount(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Checking notes count.");
    let options = this.makeNoteFindOptions(params);
    return this.requestService.count(NoteEntity, options).then(count => {
      if (count > 100)
        if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
          return Promise.reject(new TerminateResult(`User Canceled`));
      return Promise.resolve();
    });
  }

  private getNotes(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Getting notes.");
    let options = this.makeNoteFindOptions(params);
    return this.requestService.find<NoteEntity>(NoteEntity, options).then(notes => {
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
    });
  }

  private getNoteContents(): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    return MyPromise.eachSeries(this.notes, (note, noteGuid) => {
      this.progressService.set(`Request remote contents. ${++count} / ${_.size(this.notes)}`);
      if (!note.hasContent)
        return this.requestService.getNoteContent(noteGuid).then(note => {
          this.notes[note.guid] = note;
        });
      return Promise.resolve();
    });
  }

  private getTimeLogs(params: IDatastoreServiceParams): Promise<void> {
    this.progressService.next("Getting time logs.");
    let guids: string[] = [];
    for (let noteGuid in this.notes) {
      var note = this.notes[noteGuid];
      guids.push(note.guid);
    }
    let options = this.makeTimeLogFindOptions(_.merge({}, params, {noteGuids: guids}));
    return this.requestService.find<TimeLogEntity>(TimeLogEntity, options).then(timeLogs => {
      this.timeLogs = {};
      for (var timeLog of timeLogs) {
        if (!this.timeLogs[timeLog.noteGuid])
          this.timeLogs[timeLog.noteGuid] = {};
        this.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
      }
    });
  }

  private getProfitLogs(): Promise<void> {
    this.progressService.next("Getting profit logs.");
    let guids: string[] = [];
    for (let noteGuid in this.notes) {
      let note = this.notes[noteGuid];
      guids.push(note.guid);
    }
    return this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {query: {noteGuid: {$in: guids}}}).then(profitLogs => {
      this.profitLogs = {};
      for (let profitLog of profitLogs) {
        if (!this.profitLogs[profitLog.noteGuid])
          this.profitLogs[profitLog.noteGuid] = {};
        this.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
      }
    });
  }

  reParse(): Promise<void> {
    this.progressService.open(2);
    this.progressService.next("Re Parse notes...");
    return this.requestService.reParseNote().then(() => {
      this.progressService.next("Done.");
      this.progressService.close();
    }).catch(err => {
      this.progressService.close();
      throw err;
    });
  }

  countNotes(params: IDatastoreServiceParams): Promise<number> {
    let options = this.makeNoteFindOptions(params);
    return this.requestService.count(NoteEntity, options).then(count => {
      return count;
    });
  }

  countTimeLogs(params: IDatastoreServiceParams): Promise<number> {
    let options = this.makeTimeLogFindOptions(params);
    return this.requestService.count(TimeLogEntity, options).then(count => {
      return count;
    });
  }

  getPrevNote(note: NoteEntity, minStepMinute: number): Promise<NoteEntity> {
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
    return this.requestService.findOne<NoteEntity>(NoteEntity, options);
  }

  protected makeNoteFindOptions(params: IDatastoreServiceParams): IMultiEntityFindOptions {
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
      // check stacks
      if (this.filterParams.stacks && this.filterParams.stacks.length > 0)
        for (var stack of this.filterParams.stacks)
          for (let notebookGuid in this.notebooks) {
            var notebook = this.notebooks[notebookGuid];
            if (stack == notebook.stack)
              notebooksHash[notebook.guid] = true;
          }
      // set notebooks query
      if (_.size(notebooksHash) > 0)
        options.query.$and.push({notebookGuid: {$in: _.keys(notebooksHash)}});
    }
    if (params.archive) {
      options.archive = true;
      options.content = true;
    }
    return options;
  };

  protected makeTimeLogFindOptions(params: IDatastoreServiceParams): IMultiEntityFindOptions {
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
  };

}
