import _ = require("lodash");

import {UserEntity} from "../../common/entity/user-entity";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseService} from "./base-service";
import {serviceRegistry} from "./service-registry";
import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise, MyPromiseTerminateResult} from "../../common/util/my-promise";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {SettingEntity} from "../../common/entity/setting-entity";

interface DataTranscieverServiceParams {
  start?: moment.Moment,
  end?: moment.Moment,
  noteGuids?: string[],
  hasContent?: boolean,
  noFilter?: boolean,
  getContent?: boolean,
}

export class DataTranscieverService extends BaseService {

  filterParams: {notebookGuids: string[], stacks: string[]} = null;

  constructor() {
    super();
    this.filterParams = {
      notebookGuids: [],
      stacks: [],
    };
  }

  reload(params: DataTranscieverServiceParams): Promise<void> {
    let noteQuery = this._makeNoteQuery(params);
    serviceRegistry.progress.open(params.getContent ? 10 : 6);
    return Promise.resolve().then(() => {
      // get user
      if (serviceRegistry.dataStore.user) return;
      serviceRegistry.progress.next("Getting user data.");
      return serviceRegistry.entity.findOne<UserEntity>(UserEntity).then(user => {
        serviceRegistry.dataStore.user = user;
      });
    }).then(() => {
      // get settings
      serviceRegistry.progress.next("Getting settings data.");
      return serviceRegistry.entity.find<SettingEntity>(SettingEntity).then(settings => {
        let result: {[key:string]: any} = {};
        for (let setting of settings) result[setting._id] = setting.value;
        serviceRegistry.dataStore.settings = result;
      });
    }).then(() => {
      // check settings
      if (!serviceRegistry.dataStore.settings["persons"] || serviceRegistry.dataStore.settings["persons"].length == 0)
        return Promise.reject(new MyPromiseTerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
      // sync
      serviceRegistry.progress.next("Syncing remote server.");
      return serviceRegistry.entity.sync();
    }).then(() => {
      // get notebooks
      serviceRegistry.progress.next("Getting notebooks data.");
      return serviceRegistry.entity.find<NotebookEntity>(NotebookEntity).then(notebooks => {
        serviceRegistry.dataStore.notebooks = _.keyBy(notebooks, "guid");
        serviceRegistry.dataStore.stacks = _(notebooks).map<string>("stack").uniq().value();
      });
    }).then(() => {
      if (params.getContent) return Promise.resolve().then(() => {
        // get note count
        serviceRegistry.progress.next("Getting notes count.");
        return serviceRegistry.entity.count(NoteEntity, noteQuery).then(count => {
          if (count > 100)
            if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
              return Promise.reject(new MyPromiseTerminateResult(`User Canceled`));
        });
      }).then(() => {
        // get notes
        serviceRegistry.progress.next("Getting notes.");
        return serviceRegistry.entity.find<NoteEntity>(NoteEntity, noteQuery).then(notes => {
          serviceRegistry.dataStore.notes = _.keyBy(notes, "guid");
        });
      }).then(() => {
        // get content from remote
        serviceRegistry.progress.next("Request remote contents.");
        let count = 0;
        return MyPromise.eachPromiseSeries(serviceRegistry.dataStore.notes, (note, noteGuid) => {
          serviceRegistry.progress.set(`Request remote contents. ${++count} / ${_.size(serviceRegistry.dataStore.notes)}`);
          if (!note.hasContent)
            return serviceRegistry.entity.getNoteContent(noteGuid).then(notes => {
              for (note of notes)
                serviceRegistry.dataStore.notes[note.guid] = note;
            });
        });
      }).then(() => {
        // get time logs
        serviceRegistry.progress.next("Getting time logs.");
        let guids: string[] = [];
        for (let noteGuid in serviceRegistry.dataStore.notes) {
          var note = serviceRegistry.dataStore.notes[noteGuid];
          guids.push(note.guid);
        }
        let timeLogQuery = this._makeTimeLogQuery(_.merge({}, params, {noteGuids: guids}));
        return serviceRegistry.entity.find<TimeLogEntity>(TimeLogEntity, timeLogQuery).then(timeLogs => {
          serviceRegistry.dataStore.timeLogs = {};
          for (var timeLog of timeLogs) {
            if (!serviceRegistry.dataStore.timeLogs[timeLog.noteGuid])
              serviceRegistry.dataStore.timeLogs[timeLog.noteGuid] = {};
            serviceRegistry.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
          }
        });
      }).then(() => {
        // get profit logs
        serviceRegistry.progress.next("Getting profit logs.");
        let guids: string[] = [];
        for (let noteGuid in serviceRegistry.dataStore.notes) {
          let note = serviceRegistry.dataStore.notes[noteGuid];
          guids.push(note.guid);
        }
        return serviceRegistry.entity.find<ProfitLogEntity>(ProfitLogEntity, {noteGuid: {$in: guids}}).then(profitLogs => {
          serviceRegistry.dataStore.profitLogs = {};
          for (let profitLog of profitLogs) {
            if (!serviceRegistry.dataStore.profitLogs[profitLog.noteGuid])
              serviceRegistry.dataStore.profitLogs[profitLog.noteGuid] = {};
            serviceRegistry.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
          }
        });
      });
    }).then(() => {
      serviceRegistry.progress.next("Done.");
      serviceRegistry.progress.close();
    }).catch(err => {
      alert(err);
      serviceRegistry.progress.close();
      if (!(err instanceof MyPromiseTerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
    });
  }

  reParse(): Promise<void> {
    serviceRegistry.progress.open(2);
    serviceRegistry.progress.next("Re Parse notes...");
    return serviceRegistry.entity.reParseNote().then(() => {
      serviceRegistry.progress.next("Done.");
      serviceRegistry.progress.close();
    }).catch(err => {
      serviceRegistry.progress.close();
      throw err;
    });
  }

  countNotes(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeNoteQuery(params);
    return serviceRegistry.entity.count(NoteEntity, query).then(count => {
      return count;
    });
  }

  countTimeLogs(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeTimeLogQuery(params);
    return serviceRegistry.entity.count(TimeLogEntity, query).then(count => {
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
          for (let notebookGuid in serviceRegistry.dataStore.notebooks) {
            var notebook = serviceRegistry.dataStore.notebooks[notebookGuid];
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
