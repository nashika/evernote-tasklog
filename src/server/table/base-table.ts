import Datastore = require("nedb");

import core from "../core";
import _ = require("lodash");

export abstract class BaseTable {

  static PLURAL_NAME: string = "";

  static TITLE_FIELD: string = "name";

  static REQUIRE_USER: boolean = true;

  protected _username: string = "";

  protected _datastore: any = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  constructor(username: string = "") {
    if ((<typeof BaseTable>this.constructor).REQUIRE_USER && !username) {
      core.loggers.system.fatal(`need username.`);
      process.exit(1);
    }
    var dbPath = `${__dirname}/../../../db/${username ? username + "/" : ""}`;
    this._username = username;
    this._datastore = new Datastore({
      filename: dbPath + _.kebabCase(pluralize.plural(this.Class.PLURAL_NAME)) + ".db",
      autoload: true
    });
  }

}
