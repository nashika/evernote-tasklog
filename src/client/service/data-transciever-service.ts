import _ = require("lodash");

import {UserEntity} from "../../common/entity/user-entity";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseClientService} from "./base-client-service";
import {clientServiceRegistry} from "./client-service-registry";
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

export class DataTranscieverService extends BaseClientService {

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
    clientServiceRegistry.progress.open(params.getContent ? 10 : 6);
    return Promise.resolve().then(() => {
      // get user
      if (clientServiceRegistry.dataStore.user) return;
      clientServiceRegistry.progress.next("Getting user data.");
      return clientServiceRegistry.request.findOne<UserEntity>(UserEntity).then(user => {
        clientServiceRegistry.dataStore.user = user;
      });
    }).then(() => {
      // get settings
      clientServiceRegistry.progress.next("Getting settings data.");
      return clientServiceRegistry.request.find<SettingEntity>(SettingEntity).then(settings => {
        let result: {[key:string]: any} = {};
        for (let setting of settings) result[setting._id] = setting.value;
        clientServiceRegistry.dataStore.settings = result;
      });
    }).then(() => {
      // check settings
      if (!clientServiceRegistry.dataStore.settings["persons"] || clientServiceRegistry.dataStore.settings["persons"].length == 0)
        return Promise.reject(new MyPromiseTerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
      // sync
      clientServiceRegistry.progress.next("Syncing remote server.");
      return clientServiceRegistry.request.sync();
    }).then(() => {
      // get notebooks
      clientServiceRegistry.progress.next("Getting notebooks data.");
      return clientServiceRegistry.request.find<NotebookEntity>(NotebookEntity).then(notebooks => {
        clientServiceRegistry.dataStore.notebooks = _.keyBy(notebooks, "guid");
        clientServiceRegistry.dataStore.stacks = _(notebooks).map<string>("stack").uniq().value();
      });
    }).then(() => {
      if (params.getContent) return Promise.resolve().then(() => {
        // get note count
        clientServiceRegistry.progress.next("Getting notes count.");
        return clientServiceRegistry.request.count(NoteEntity, noteQuery).then(count => {
          if (count > 100)
            if (!window.confirm(`Current query find ${count} notes. It is too many. Continue anyway?`))
              return Promise.reject(new MyPromiseTerminateResult(`User Canceled`));
        });
      }).then(() => {
        // get notes
        clientServiceRegistry.progress.next("Getting notes.");
        return clientServiceRegistry.request.find<NoteEntity>(NoteEntity, noteQuery).then(notes => {
          clientServiceRegistry.dataStore.notes = _.keyBy(notes, "guid");
        });
      }).then(() => {
        // get content from remote
        clientServiceRegistry.progress.next("Request remote contents.");
        let count = 0;
        return MyPromise.eachPromiseSeries(clientServiceRegistry.dataStore.notes, (note, noteGuid) => {
          clientServiceRegistry.progress.set(`Request remote contents. ${++count} / ${_.size(clientServiceRegistry.dataStore.notes)}`);
          if (!note.hasContent)
            return clientServiceRegistry.request.getContentNote(noteGuid).then(notes => {
              for (note of notes)
                clientServiceRegistry.dataStore.notes[note.guid] = note;
            });
        });
      }).then(() => {
        // get time logs
        clientServiceRegistry.progress.next("Getting time logs.");
        let guids: string[] = [];
        for (let noteGuid in clientServiceRegistry.dataStore.notes) {
          var note = clientServiceRegistry.dataStore.notes[noteGuid];
          guids.push(note.guid);
        }
        let timeLogQuery = this._makeTimeLogQuery(_.merge({}, params, {noteGuids: guids}));
        return clientServiceRegistry.request.find<TimeLogEntity>(TimeLogEntity, timeLogQuery).then(timeLogs => {
          clientServiceRegistry.dataStore.timeLogs = {};
          for (var timeLog of timeLogs) {
            if (!clientServiceRegistry.dataStore.timeLogs[timeLog.noteGuid])
              clientServiceRegistry.dataStore.timeLogs[timeLog.noteGuid] = {};
            clientServiceRegistry.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
          }
        });
      }).then(() => {
        // get profit logs
        clientServiceRegistry.progress.next("Getting profit logs.");
        let guids: string[] = [];
        for (let noteGuid in clientServiceRegistry.dataStore.notes) {
          let note = clientServiceRegistry.dataStore.notes[noteGuid];
          guids.push(note.guid);
        }
        return clientServiceRegistry.request.find<ProfitLogEntity>(ProfitLogEntity, {noteGuid: {$in: guids}}).then(profitLogs => {
          clientServiceRegistry.dataStore.profitLogs = {};
          for (let profitLog of profitLogs) {
            if (!clientServiceRegistry.dataStore.profitLogs[profitLog.noteGuid])
              clientServiceRegistry.dataStore.profitLogs[profitLog.noteGuid] = {};
            clientServiceRegistry.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
          }
        });
      });
    }).then(() => {
      clientServiceRegistry.progress.next("Done.");
      clientServiceRegistry.progress.close();
    }).catch(err => {
      alert(err);
      clientServiceRegistry.progress.close();
      if (!(err instanceof MyPromiseTerminateResult))
        throw new Error(`HTTP request error. err=${err}`);
    });
  }

  reParse(): Promise<void> {
    clientServiceRegistry.progress.open(2);
    clientServiceRegistry.progress.next("Re Parse notes...");
    return clientServiceRegistry.request.reParseNote().then(() => {
      clientServiceRegistry.progress.next("Done.");
      clientServiceRegistry.progress.close();
    }).catch(err => {
      clientServiceRegistry.progress.close();
      throw err;
    });
  }

  countNotes(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeNoteQuery(params);
    return clientServiceRegistry.request.count(NoteEntity, query).then(count => {
      return count;
    });
  }

  countTimeLogs(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeTimeLogQuery(params);
    return clientServiceRegistry.request.count(TimeLogEntity, query).then(count => {
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
          for (let notebookGuid in clientServiceRegistry.dataStore.notebooks) {
            var notebook = clientServiceRegistry.dataStore.notebooks[notebookGuid];
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
