import _ = require("lodash");

import {BaseTable} from "./base.table";
import {BaseSingleEntity} from "../../common/entity/base-single.entity";

export abstract class BaseSingleTable<T extends BaseSingleEntity> extends BaseTable {

  EntityClass: typeof BaseSingleEntity;

  get Class(): typeof BaseSingleTable {
    return <typeof BaseSingleTable>this.constructor;
  }

  async findOne(): Promise<T> {
    this.message("load", ["local"], this.EntityClass.params.name, true);
    return await new Promise<T>((resolve, reject) => {
      this.datastore.findOne({_id: "1"}, (err, doc) => {
        this.message("load", ["local"], this.EntityClass.params.name, false, null, err);
        if (err) return reject(err);
        if (doc)
          resolve(new (<any>this.EntityClass)(doc));
        else
          resolve(new (<any>this.EntityClass)(_.cloneDeep(this.EntityClass.params.defaultDoc)));
      });
    });
  }

  async save(doc: T): Promise<void> {
    doc._id = "1";
    this.message("upsert", ["local"], this.EntityClass.params.name, true);
    await new Promise<void>((resolve, reject) => {
      this.datastore.update({_id: "1"}, doc, {upsert: true}, (err, numReplaced, newDoc) => {
        this.message("upsert", ["local"], this.EntityClass.params.name, false, {numReplaced: numReplaced}, err);
        if (err) return reject(err);
        resolve(new (<any>this.EntityClass)(newDoc));
      });
    });
  }

}
