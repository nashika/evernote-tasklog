import _ = require("lodash");
import NeDBDataStore = require("nedb");
import pluralize = require("pluralize");
import evernote = require("evernote");
import {injectable} from "inversify";

import core from "../core";
import {BaseEntity} from "../../common/entity/base-entity";

@injectable()
export abstract class BaseTable {

  static EntityClass: typeof BaseEntity;

  static PLURAL_NAME: string = "";
  static TITLE_FIELD: string = "name";
  static REQUIRE_USER: boolean = true;

  protected username: string = "";
  protected datastore: NeDBDataStore = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  connect(username: string = "") {
    if (this.Class.REQUIRE_USER && !username) {
      throw Error(`need username.`);
    }
    var dbPath = `${__dirname}/../../../db/${username ? username + "/" : ""}`;
    this.username = username;
    this.datastore = new NeDBDataStore({
      filename: dbPath + _.kebabCase(pluralize.plural(this.Class.PLURAL_NAME)) + ".db",
      autoload: true
    });
  }

  getOtherTable<T extends BaseTable>(name: string): T {
    return <T>core.users[this.username].models[name];
  }

  getClient(): evernote.Evernote.Client {
    return core.users[this.username].client;
  }

}
