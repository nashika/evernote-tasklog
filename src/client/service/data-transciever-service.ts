import request = require("superagent");
import _ = require("lodash");

import {UserEntity} from "../../common/entity/user-entity";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseService} from "./base-service";
import {serviceRegistry} from "./service-registry";
import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise, MyPromiseTerminateResult} from "../../common/util/my-promise";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";

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
    let noteCount = 0;
    serviceRegistry.progress.open(params.getContent ? 10 : 6);
    return Promise.resolve().then(() => {
      // get user
      if (serviceRegistry.dataStore.user) return;
      serviceRegistry.progress.next("Getting user data.");
      return request.get("/user").then(res => {
        let data: UserEntity = res.body;
        serviceRegistry.dataStore.user = data;
      });
    }).then(() => {
      // get settings
      serviceRegistry.progress.next("Getting settings data.");
      return request.get("/settings").then(res => {
        let data: {[key: string]: any} = res.body;
        serviceRegistry.dataStore.settings = res.body;
      });
    }).then(() => {
      // check settings
      if (!serviceRegistry.dataStore.settings["persons"] || serviceRegistry.dataStore.settings["persons"].length == 0)
        return Promise.reject(new MyPromiseTerminateResult(`This app need persons setting. Please switch "Settings Page" and set your persons data.`));
      // sync
      serviceRegistry.progress.next("Syncing remote server.");
      return request.get("/sync").then(() => {});
    }).then(() => {
      // get notebooks
      serviceRegistry.progress.next("Getting notebooks data.");
      return request.get("/notebooks").then(res => {
        let data: NotebookEntity[] = res.body;
        serviceRegistry.dataStore.notebooks = {};
        let stackHash: {[stack: string]: boolean} = {};
        for (let notebook of data) {
          serviceRegistry.dataStore.notebooks[notebook.guid] = notebook;
          if (notebook.stack) stackHash[notebook.stack] = true;
        }
        serviceRegistry.dataStore.stacks = Object.keys(stackHash);
      });
    }).then(() => {
      if (params.getContent) return Promise.resolve().then(() => {
        // get note count
        serviceRegistry.progress.next("Getting notes count.");
        return request.get("/notes/count").query({query: noteQuery}).then(res => {
          let noteCount: number = res.body;
          if (noteCount > 100)
            if (!window.confirm(`Current query find ${noteCount} notes. It is too many. Continue anyway?`))
              return Promise.reject(new MyPromiseTerminateResult(`User Canceled`));
        });
      }).then(() => {
        // get notes
        serviceRegistry.progress.next("Getting notes.");
        return request.get("/notes").query({query: noteQuery}).then(res => {
          let data: NoteEntity[] = res.body;
          serviceRegistry.dataStore.notes = {};
          for (var note of data)
            serviceRegistry.dataStore.notes[note.guid] = note;
        });
      }).then(() => {
        // get content from remote
        serviceRegistry.progress.next("Request remote contents.");
        let count = 0;
        return MyPromise.eachFunctionSeries(serviceRegistry.dataStore.notes, (resolve, reject, note, noteGuid) => {
          serviceRegistry.progress.set(`Request remote contents. ${++count} / ${Object.keys(serviceRegistry.dataStore.notes).length}`);
          if (!note.hasContent)
            return request.get("/notes/get-content").query({query: {guid: noteGuid}}).then(res => {
              let data: NoteEntity[] = res.body;
              for (note of data)
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
        return request.post("/time-logs").send({query: timeLogQuery}).then(req => {
          let data: TimeLogEntity[] = req.body;
          serviceRegistry.dataStore.timeLogs = {};
          for (var timeLog of data) {
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
        return request.post("/profit-logs").send({query: {noteGuid: {$in: guids}}}).then(req => {
          let data: ProfitLogEntity[] = req.body;
          serviceRegistry.dataStore.profitLogs = {};
          for (let profitLog of data) {
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
    return Promise.resolve().then(() => {
      request.get("/notes/re-parse").then(req => {
        serviceRegistry.progress.next("Done.");
        serviceRegistry.progress.close();
      }).catch(err => {
        serviceRegistry.progress.close();
        throw err;
      });
    });
  }

  countNotes(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeNoteQuery(params);
    return request.get("/notes/count").query({query: query}).then(req => {
      let data: number = req.body;
      return data;
    });
  }

  countTimeLogs(params: DataTranscieverServiceParams): Promise<number> {
    let query = this._makeTimeLogQuery(params);
    return request.get("/time-logs/count").query({query: query}).then(req => {
      let data: number = req.body;
      return data;
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
      // set notebooks query checked before
      var notebooksArray = Object.keys(notebooksHash);
      if (notebooksArray.length > 0)
        _.merge(result, {notebookGuid: {$in: notebooksArray}});
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
      _.merge(result, {noteGuid: {$in: params.noteGuids}});
    return result;
  };

}
