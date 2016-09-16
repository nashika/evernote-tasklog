import _ = require("lodash");
import NeDBDataStore = require("nedb");
import pluralize = require("pluralize");
import evernote = require("evernote");
import {injectable} from "inversify";

import core from "../core";
import {BaseEntity} from "../../common/entity/base-entity";
import {kernel} from "../inversify.config";

@injectable()
export abstract class BaseTable {

  EntityClass: typeof BaseEntity;

  protected username: string = "";
  protected datastore: NeDBDataStore = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  constructor() {
    let name = _.lowerFirst(_.replace(this.Class.name, /Table$/, ""));
    this.EntityClass = <any>kernel.getNamed(BaseEntity, name);
  }

  connect(username: string = "") {
    if (this.EntityClass.params.requireUser && !username) {
      throw Error(`need username.`);
    }
    var dbPath = `${__dirname}/../../../db/${username ? username + "/" : ""}`;
    this.username = username;
    this.datastore = new NeDBDataStore({
      filename: dbPath + _.kebabCase(pluralize.plural(this.EntityClass.params.name)) + ".db",
      autoload: true
    });
  }

}
