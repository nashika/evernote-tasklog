import evernote = require("evernote");

import {Www} from "./www";
import {UserEntity} from "../common/entity/user-entity";
import {SettingTable} from "./table/setting-table";
import {BaseTable} from "./table/base-table";


interface UserCore {
  client?: evernote.Evernote.Client;
  user?: UserEntity;
}

export class Core {
  www: Www;
  users: {[username: string]: UserCore};

  constructor() {
    this.users = {};
  }
}

var core = new Core();

export default core;
