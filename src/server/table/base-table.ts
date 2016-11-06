import _ = require("lodash");
import NeDBDataStore = require("nedb");
import pluralize = require("pluralize");
import {injectable} from "inversify";
import {getLogger} from "log4js";

import {BaseEntity} from "../../common/entity/base-entity";
import {kernel} from "../inversify.config";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

let logger = getLogger("system");

@injectable()
export abstract class BaseTable {

  EntityClass: typeof BaseEntity;

  protected globalUser: GlobalUserEntity;
  protected datastore: NeDBDataStore = null;
  protected archiveDatastore: NeDBDataStore = null;

  get Class(): typeof BaseTable {
    return <typeof BaseTable>this.constructor;
  }

  constructor() {
    let name = _.lowerFirst(_.replace(this.Class.name, /Table$/, ""));
    this.EntityClass = <any>kernel.getNamed(BaseEntity, name);
  }

  connect(globalUser: GlobalUserEntity = null) {
    if (this.EntityClass.params.requireUser && !globalUser) {
      throw Error(`need username.`);
    }
    let dbPath = `${__dirname}/../../../db/${globalUser ? globalUser._id + "/" : ""}`;
    this.globalUser = globalUser;
    this.datastore = new NeDBDataStore({
      filename: dbPath + _.kebabCase(pluralize.plural(this.EntityClass.params.name)) + ".db",
      autoload: true,
    });
    if (this.EntityClass.params.archive) {
      this.archiveDatastore = new NeDBDataStore({
        filename: dbPath + _.kebabCase(pluralize.plural(this.EntityClass.params.name)) + ".archive.db",
        autoload: true,
      });
    }
  }

  protected message(action: string, options: string[], name: string, isStart: boolean, dispData: Object = null, err: any = null) {
    let message = `${_.startCase(action)} ${_.join(options, " ")} ${name} was ${isStart ? "started" : err ? "failed" : "finished"}.${err ? " err=" + JSON.stringify(err) : ""}${dispData ? " " + JSON.stringify(dispData) : ""}`;
    if (err) {
      logger.error(message);
    } else {
      logger.trace(message);
    }
  }

}
