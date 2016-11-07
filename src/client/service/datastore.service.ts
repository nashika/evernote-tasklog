import _ = require("lodash");
import {injectable} from "inversify";

import {NoteEntity} from "../../common/entity/note.entity";
import {UserEntity} from "../../common/entity/user.entity";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseClientService} from "./base-client.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {ProgressService} from "./progress.service";
import {RequestService} from "./request.service";
import {SettingEntity} from "../../common/entity/setting.entity";
import {MyPromiseTerminateResult, MyPromise} from "../../common/util/my-promise";

interface IDatastoreServiceParams {
  start?: moment.Moment,
  end?: moment.Moment,
  noteGuids?: string[],
  hasContent?: boolean,
  noFilter?: boolean,
  getContent?: boolean,
  getArchive?: boolean,
  manual?: boolean,
}

@injectable()
export class DatastoreService extends BaseClientService {

  lastUpdateCount: number;
  globalUser: GlobalUserEntity;
  user: UserEntity;
  persons: Object[];
  notebooks: {[guid: string]: NotebookEntity};
  stacks: string[];
  notes: {[guid: string]: NoteEntity};
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
    this.persons = [];
    this.notebooks = {};
    this.stacks = [];
    this.notes = {};
    this.timeLogs = {};
    this.profitLogs = {};
    this.settings = {};
    this.filterParams = {
      notebookGuids: [],
      stacks: [],
    };
  }

  reload(params: IDatastoreServiceParams = {}): Promise<boolean> {
    if (!this.globalUser) return Promise.resolve(false);
    let noteQuery = this.makeNoteQuery(params);
    return Promise.resolve().then(() => {
      return this.checkUpdateCount(params);
    }).then(() => {
      this.progressService.open(params.getContent ? 9 : 4);
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
      if (!params.getContent) return Promise.resolve();
      return Promise.resolve().then(() => {
        return this.checkNoteCount(noteQuery);
      }).then(() => {
        return this.getNotes(noteQuery);
      }).then(() => {
        return this.getNoteContents();
      }).then(() => {
        return this.getTimeLogs(params);
      }).then(() => {
        return this.getProfitLogs();
      });
    }).then(() => {
      this.progressService.next("Done.");
      this.progressService.close();
      return true;
    }).catch(err => {
      if (!(err instanceof MyPromiseTerminateResult) || err.data != null)
        alert(err);
      this.progressService.close();
      if (!(err instanceof MyPromiseTerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
      return false;
    });
  }

  private checkUpdateCount(params: IDatastoreServiceParams): Promise<void> {
    return this.requestService.getUpdateCount().then(updateCount => {
      if (params.manual) {
        this.lastUpdateCount = updateCount;
        return Promise.resolve();
      } else {
        if (this.lastUpdateCount == updateCount)
          return Promise.reject(new MyPromiseTerminateResult());
        this.lastUpdateCount = updateCount;
        return Promise.resolve();
      }
    });
  }

  private getUser(): Promise<void> {
    if (this.user) return Promise.resolve();
    this.progressService.next("Getting user data.");
    return this.requestService.findOne<UserEntity>(UserEntity).then(user => {
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
    if (!this.settings["persons"] || this.settings["persons"].length == 0)
      return Promise.reject(new MyPromiseTerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
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

  private checkNoteCount(noteQuery: Object): Promise<void> {
    this.progressService.next("Getting notes count.");
    return this.requestService.count(NoteEntity, noteQuery).then(count => {
      if (count > 100)
        if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
          return Promise.reject(new MyPromiseTerminateResult(`User Canceled`));
      return Promise.resolve();
    });
  }

  private getNotes(noteQuery: Object): Promise<void> {
    this.progressService.next("Getting notes.");
    return this.requestService.find<NoteEntity>(NoteEntity, noteQuery).then(notes => {
      this.notes = _.keyBy(notes, "guid");
    });
  }

  private getNoteContents(): Promise<void> {
    this.progressService.next("Request remote contents.");
    let count = 0;
    return MyPromise.eachPromiseSeries(this.notes, (note, noteGuid) => {
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
    let timeLogQuery = this.makeTimeLogQuery(_.merge({}, params, {noteGuids: guids}));
    return this.requestService.find<TimeLogEntity>(TimeLogEntity, timeLogQuery).then(timeLogs => {
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
    return this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {noteGuid: {$in: guids}}).then(profitLogs => {
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
    let query = this.makeNoteQuery(params);
    return this.requestService.count(NoteEntity, query).then(count => {
      return count;
    });
  }

  countTimeLogs(params: IDatastoreServiceParams): Promise<number> {
    let query = this.makeTimeLogQuery(params);
    return this.requestService.count(TimeLogEntity, query).then(count => {
      return count;
    });
  }

  protected makeNoteQuery = (params: IDatastoreServiceParams): Object => {
    var result = {};
    // set updated query
    if (params.start)
      _.merge(result, {updated: {$gte: params.start.valueOf()}});
    // set hasContent query
    if (params.hasContent)
      _.merge(result, {content: {$ne: null}});
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
        _.merge(result, {notebookGuid: {$in: _.keys(notebooksHash)}});
    }
    return result;
  };

  protected makeTimeLogQuery = (params: IDatastoreServiceParams): Object => {
    var result = {};
    // set date query
    if (params.start)
      _.merge(result, {date: {$gte: params.start.valueOf()}});
    if (params.end)
      _.merge(result, {date: {$lte: params.end.valueOf()}});
    // set noFilter query
    if (params.noFilter) {
    }
    // set note guids query
    if (params.noteGuids)
      if (params.noteGuids.length > 0)
        _.merge(result, {noteGuid: {$in: params.noteGuids}});
    return result;
  };

}
