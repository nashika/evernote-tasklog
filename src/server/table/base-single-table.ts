import _ = require("lodash");

import core from "../core";
import {BaseTable} from "./base-table";
import {Entity} from "../../common/entity/entity";

export abstract class BaseSingleTable<T extends Entity> extends BaseTable {

  static DEFAULT_DOC: Entity = {};

  get Class(): typeof BaseSingleTable {
    return <typeof BaseSingleTable>this.constructor;
  }

  loadLocal(): Promise<T> {
    var query: Object = {_id: "1"};
    var sort: Object = {};
    var limit: number = 1;
    core.loggers.system.debug(`Load local ${this.Class.PLURAL_NAME} was started.`);
    return new Promise<T>((resolve, reject) => {
      this._datastore.find(query).sort(sort).limit(limit).exec((err: Error, docs: Array<T>) => {
        core.loggers.system.debug(`Load local ${this.Class.PLURAL_NAME} was ${err ? "failed" : "succeed"}. docs.length=${docs.length}`);
        if (err) return reject(err);
        let doc: T = docs.length == 0 ? _.merge<T>({}, this.Class.DEFAULT_DOC) : docs[0];
        resolve(doc);
      });
    });
  }

  saveLocal(doc: T): Promise<void> {
    doc._id = "1";
    return new Promise<void>((resolve, reject) => {
      this._datastore.update({_id: "1"}, doc, {upsert: true}, (err: Error, numReplaced: number, newDoc: T) => {
        if (err) return reject(err);
        core.loggers.system.debug(`Upsert ${(<typeof BaseSingleTable>this.constructor).PLURAL_NAME} end. numReplaced=${numReplaced}`);
        resolve();
      });
    });
  }

}
