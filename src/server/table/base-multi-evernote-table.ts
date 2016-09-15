import _ = require("lodash");
import {getLogger} from "log4js";

import {BaseMultiTable} from "./base-multi-table";
import {BaseMultiEvernoteEntity} from "../../common/entity/base-multi-evernote-entity";
import {MyPromise} from "../../common/util/my-promise";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";

let logger = getLogger("system");

export class BaseMultiEvernoteTable<T1 extends BaseMultiEvernoteEntity<any>, T2 extends IMultiEntityFindOptions> extends BaseMultiTable<T1, T2> {

  saveByGuid(entities: T1|T1[]): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T1[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    logger.debug(`Save local ${this.EntityClass.params.name} was started. docs.count=${arrEntities.length}`);
    return MyPromise.eachFunctionSeries<T1>(arrEntities, (resolve, reject, entity) => {
      logger.trace(`Upsert local ${this.EntityClass.params.name} was started. guid=${entity.guid}, title=${_.get(entity, this.EntityClass.params.titleField)}`);
      this.datastore.update({guid: entity.guid}, entity, {upsert: true}, (err, numReplaced) => {
        logger.trace(`Upsert local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}. guid=${entity.guid}, numReplaced=${numReplaced}`);
        if (err) return reject(err);
        resolve();
      });
    }).then(() => {
      logger.debug(`Save local ${this.EntityClass.params.name} was succeed. docs.count=${arrEntities.length}`);
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
