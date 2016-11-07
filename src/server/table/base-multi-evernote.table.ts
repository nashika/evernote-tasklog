import _ = require("lodash");

import {BaseMultiTable} from "./base-multi.table";
import {BaseMultiEvernoteEntity} from "../../common/entity/base-multi-evernote.entity";
import {MyPromise} from "../../common/util/my-promise";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";

export class BaseMultiEvernoteTable<T1 extends BaseMultiEvernoteEntity, T2 extends IMultiEntityFindOptions> extends BaseMultiTable<T1, T2> {

  saveByGuid(entities: T1|T1[], archive: boolean = false): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T1[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    this.message("save", ["local"], this.EntityClass.params.name, true, {"docs.count": arrEntities.length});
    return MyPromise.eachFunctionSeries<T1>(arrEntities, (resolve, reject, entity) => {
      this.message("upsert", ["local"], this.EntityClass.params.name, true, {guid: entity.guid, title:_.get(entity, this.EntityClass.params.titleField)});
      this.datastore.update({guid: entity.guid}, entity, {upsert: true}, (err, numReplaced) => {
        this.message("upsert", ["local"], this.EntityClass.params.name, false, {guid: entity.guid, numReplaced: numReplaced}, err);
        if (err) return reject(err);
        resolve();
      });
    }).then(() => {
      if (!this.EntityClass.params.archive || !archive) return Promise.resolve();
      return MyPromise.eachFunctionSeries<T1>(arrEntities, (resolve, reject, entity) => {
        this.message("upsert", ["local", "archive"], this.EntityClass.params.name, true, {guid: entity.guid, usn: entity.updateSequenceNum, title:_.get(entity, this.EntityClass.params.titleField)});
        this.archiveDatastore.update({guid: entity.guid, updateSequenceNum: entity.updateSequenceNum}, entity, {upsert: true}, (err, numReplaced) => {
          this.message("upsert", ["local", "archive"], this.EntityClass.params.name, false, {guid: entity.guid, numReplaced: numReplaced}, err);
          if (err) return reject(err);
          resolve();
        });
      });
    }).then(() => {
      this.message("save", ["local"], this.EntityClass.params.name, false, {"docs.count": arrEntities.length});
    });
  }

  removeByGuid(query: string|string[]): Promise<void> {
    if (!query) return Promise.resolve();
    let objQuery: Object;
    if (_.isArray(query)) {
      if (_.size(query) == 0) return Promise.resolve();
      objQuery = {guid: {$in: query}};
    } else if (_.isString(query)) {
      objQuery = {guid: query};
    }
    return this.remove(objQuery);
  }

}
