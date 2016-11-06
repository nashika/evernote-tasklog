import _ = require("lodash");
import {injectable} from "inversify";

import {UserEntity} from "../../common/entity/user-entity";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseClientService} from "./base-client-service";
import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise, MyPromiseTerminateResult} from "../../common/util/my-promise";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {SettingEntity} from "../../common/entity/setting-entity";
import {ProgressService} from "./progress-service";
import {DataStoreService} from "./data-store-service";
import {RequestService} from "./request-service";

interface DataTranscieverServiceParams {
  start?: moment.Moment,
  end?: moment.Moment,
  noteGuids?: string[],
  hasContent?: boolean,
  noFilter?: boolean,
  getContent?: boolean,
}

@injectable()
export class DataTranscieverService extends BaseClientService {

  filterParams: {notebookGuids: string[], stacks: string[]} = null;

  constructor(protected dataStoreService: DataStoreService,
              protected requestService: RequestService,
              protected progressService: ProgressService) {
    super();
    this.filterParams = {
      notebookGuids: [],
      stacks: [],
    };
  }

  reload(params: DataTranscieverServiceParams): Promise<void> {
    let noteQuery = this._makeNoteQuery(params);
    this.progressService.open(params.getContent ? 10 : 6);
    return Promise.resolve().then(() => {
      // get user
      if (this.dataStoreService.user) return null;
      this.progressService.next("Getting user data.");
      return this.requestService.findOne<UserEntity>(UserEntity).then(user => {
        this.dataStoreService.user = user;
      });
    }).then(() => {
      // get settings
      this.progressService.next("Getting settings data.");
      return this.requestService.find<SettingEntity>(SettingEntity).then(settings => {
        let result: {[key: string]: any} = {};
        for (let setting of settings) result[setting._id] = setting.value;
        this.dataStoreService.settings = result;
      });
    }).then(() => {
      // check settings
      if (!this.dataStoreService.settings["persons"] || this.dataStoreService.settings["persons"].length == 0)
        return Promise.reject(new MyPromiseTerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
      // sync
      this.progressService.next("Syncing remote server.");
      return this.requestService.sync();
    }).then(() => {
      // get notebooks
      this.progressService.next("Getting notebooks data.");
      return this.requestService.find<NotebookEntity>(NotebookEntity).then(notebooks => {
        this.dataStoreService.notebooks = _.keyBy(notebooks, "guid");
        this.dataStoreService.stacks = _(notebooks).map<string>("stack").uniq().value();
      });
    }).then(() => {
      if (!params.getContent) return null;
      return Promise.resolve().then(() => {
        // get note count
        this.progressService.next("Getting notes count.");
        return this.requestService.count(NoteEntity, noteQuery).then(count => {
          if (count > 100)
            if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
              return Promise.reject(new MyPromiseTerminateResult(`User Canceled`));
          return null;
        });
      }).then(() => {
        // get notes
        this.progressService.next("Getting notes.");
        return this.requestService.find<NoteEntity>(NoteEntity, noteQuery).then(notes => {
          this.dataStoreService.notes = _.keyBy(notes, "guid");
        });
      }).then(() => {
        // get content from remote
        this.progressService.next("Request remote contents.");
        let count = 0;
        return MyPromise.eachPromiseSeries(this.dataStoreService.notes, (note, noteGuid) => {
          this.progressService.set(`Request remote contents. ${++count} / ${_.size(this.dataStoreService.notes)}`);
          if (!note.hasContent)
            return this.requestService.getContentNote(noteGuid).then(note => {
              this.dataStoreService.notes[note.guid] = note;
            });
          return null;
        });
      }).then(() => {
        // get time logs
        this.progressService.next("Getting time logs.");
        let guids: string[] = [];
        for (let noteGuid in this.dataStoreService.notes) {
          var note = this.dataStoreService.notes[noteGuid];
          guids.push(note.guid);
        }
        let timeLogQuery = this._makeTimeLogQuery(_.merge({}, params, {noteGuids: guids}));
        return this.requestService.find<TimeLogEntity>(TimeLogEntity, timeLogQuery).then(timeLogs => {
          this.dataStoreService.timeLogs = {};
          for (var timeLog of timeLogs) {
            if (!this.dataStoreService.timeLogs[timeLog.noteGuid])
              this.dataStoreService.timeLogs[timeLog.noteGuid] = {};
            this.dataStoreService.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
          }
        });
      }).then(() => {
        // get profit logs
        this.progressService.next("Getting profit logs.");
        let guids: string[] = [];
        for (let noteGuid in this.dataStoreService.notes) {
          let note = this.dataStoreService.notes[noteGuid];
          guids.push(note.guid);
        }
        return this.requestService.find<ProfitLogEntity>(ProfitLogEntity, {noteGuid: {$in: guids}}).then(profitLogs => {
          this.dataStoreService.profitLogs = {};
          for (let profitLog of profitLogs) {
            if (!this.dataStoreService.profitLogs[profitLog.noteGuid])
              this.dataStoreService.profitLogs[profitLog.noteGuid] = {};
            this.dataStoreService.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
          }
        });
      });
    }).then(() => {
      this.progressService.next("Done.");
      this.progressService.close();
    }).catch(err => {
      alert(err);
      this.progressService.close();
      if (!(err instanceof MyPromiseTerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
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

  countNotes(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeNoteQuery(params);
    return this.requestService.count(NoteEntity, query).then(count => {
      return count;
    });
  }

  countTimeLogs(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeTimeLogQuery(params);
    return this.requestService.count(TimeLogEntity, query).then(count => {
      return count;
    });
  }

  protected _makeNoteQuery = (params: DataTranscieverServiceParams): Object => {
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
          for (let notebookGuid in this.dataStoreService.notebooks) {
            var notebook = this.dataStoreService.notebooks[notebookGuid];
            if (stack == notebook.stack)
              notebooksHash[notebook.guid] = true;
          }
      // set notebooks query
      if (_.size(notebooksHash) > 0)
        _.merge(result, {notebookGuid: {$in: _.keys(notebooksHash)}});
    }
    return result;
  };

  protected _makeTimeLogQuery = (params: DataTranscieverServiceParams): Object => {
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
