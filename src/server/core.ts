import evernote = require("evernote");

import {Www} from "./www";
import {UserEntity} from "../common/entity/user-entity";
import {SettingTable} from "./table/setting-table";
import {BaseTable} from "./table/base-table";

export interface UserSetting {
  persons: Array<{name: string}>;
  [key: string]: any;
}

interface UserCore {
  client?: evernote.Evernote.Client;
  user?: UserEntity;
  settings?: UserSetting;
  models?: {[name:string]: BaseTable};
}

export class Core {
  www: Www;
  settings: {[key: string]: Object};
  models: {
    settings?: SettingTable,
  };
  users: {[username: string]: UserCore};

  constructor() {
    this.models = {};
    this.users = {};
  }
}

var core = new Core();

export default core;
