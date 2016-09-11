import log4js = require("log4js");
import evernote = require("evernote");

import {Www} from "./www";
import {NotebookTable} from "./table/notebook-table";
import {UserEntity} from "../common/entity/user-entity";
import {LinkedNotebookTable} from "./table/linked-notebook-table";
import {NoteTable} from "./table/note-table";
import {ProfitLogTable} from "./table/profit-log-table";
import {SearchTable} from "./table/search-table";
import {SettingTable} from "./table/setting-table";
import {SyncStateTable} from "./table/sync-state-table";
import {TagTable} from "./table/tag-table";
import {TimeLogTable} from "./table/time-log-table";
import {UserTable} from "./table/user-table";

export interface UserSetting {
  persons: Array<{name: string}>;
  [key: string]: any;
}

interface UserCore {
  client?: evernote.Evernote.Client;
  user?: UserEntity;
  settings?: UserSetting;
  models?: {
    linkedNotebooks: LinkedNotebookTable,
    notes: NoteTable,
    notebooks: NotebookTable,
    profitLogs: ProfitLogTable,
    searches: SearchTable,
    settings: SettingTable,
    syncStates: SyncStateTable,
    tags: TagTable,
    timeLogs: TimeLogTable,
    users: UserTable,
  };
}

export class Core {
  www: Www;
  settings: {[key: string]: Object};
  loggers: {
    system?: log4js.Logger,
    access?: log4js.Logger,
    error?: log4js.Logger,
  };
  models: {
    settings?: SettingTable,
  };
  users: {[username: string]: UserCore};

  constructor() {
    this.loggers = {};
    this.models = {};
    this.users = {};
  }
}

var core = new Core();

export default core;

