import _ = require("lodash");
import {getLogger} from "log4js";

import {BaseTable} from "./base-table";
import {BaseSingleEntity} from "../../common/entity/base-single-entity";

let logger = getLogger("system");

export abstract class BaseSingleTable<T extends BaseSingleEntity> extends BaseTable {

  EntityClass: typeof BaseSingleEntity;

  get Class(): typeof BaseSingleTable {
    return <typeof BaseSingleTable>this.constructor;
  }

  findOne(): Promise<T> {
    logger.debug(`Load local ${this.EntityClass.params.name} was started.`);
    return new Promise<T>((resolve, reject) => {
      this.datastore.findOne({_id: "1"}, (err, doc) => {
        logger.debug(`Load local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}.`);
        if (err) return reject(err);
        if (doc)
          resolve(new (<any>this.EntityClass)(doc));
        else
          resolve(new (<any>this.EntityClass)(_.cloneDeep(this.EntityClass.params.defaultDoc)));
      });
    });
  }

  save(doc: T): Promise<void> {
    doc._id = "1";
    return new Promise<void>((resolve, reject) => {
      this.datastore.update({_id: "1"}, doc, {upsert: true}, (err, numReplaced, newDoc) => {
        if (err) return reject(err);
        logger.debug(`Upsert ${this.EntityClass.params.name} end. numReplaced=${numReplaced}`);
        resolve(new (<any>this.EntityClass)(newDoc));
      });
    });
  }

}
