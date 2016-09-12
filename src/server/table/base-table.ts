import _ = require("lodash");
import NeDBDataStore = require("nedb");
import pluralize = require("pluralize");

export abstract class BaseTable {

  static PLURAL_NAME: string = "";
  static TITLE_FIELD: string = "name";
  static REQUIRE_USER: boolean = true;

  protected username: string = "";
  protected datastore: NeDBDataStore = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  constructor(username: string = "") {
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

}
