import _ = require("lodash");
import {getLogger} from "log4js";

import {BaseMultiTable} from "./base-multi-table";
import {BaseMultiEvernoteEntity} from "../../common/entity/base-multi-evernote-entity";
import {MyPromise} from "../../common/util/my-promise";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";

let logger = getLogger("system");

export class BaseMultiEvernoteTable<T1 extends BaseMultiEvernoteEntity<any>, T2 extends IMultiEntityFindOptions> extends BaseMultiTable<T1, T2> {

  saveLocalUpdateOnly(entities: T1|T1[]): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T1[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    logger.debug(`Save local update only ${this.Class.PLURAL_NAME} was started. docs.count=${arrEntities.length}`);
    return MyPromise.eachFunctionSeries(arrEntities, (resolve, reject, entity) => {
      this.datastore.find({guid: entity.guid}, (err: any, docs?: T1[]) => {
        if (err) return reject(err);
        var localDoc: T1 = (docs.length == 0) ? null : docs[0];
        if (localDoc && localDoc.updateSequenceNum >= entity.updateSequenceNum) {
          logger.trace(`Upsert local ${this.Class.PLURAL_NAME} was skipped. _id=${entity._id}, title=${(<any>entity)[this.Class.TITLE_FIELD]}`);
          resolve();
        } else {
          logger.trace(`Upsert local ${this.Class.PLURAL_NAME} was started. guid=${entity._id}, title=${(<any>entity)[this.Class.TITLE_FIELD]}`);
          this.datastore.update({_id: entity._id}, entity, {upsert: true}, (err, numReplaced) => {
            if (err) return reject(err);
            logger.trace(`Upsert local ${this.Class.PLURAL_NAME} was succeed. guid=${entity.guid}, numReplaced=${numReplaced}`);
            resolve();
          });
        }
      });
    }).then(() => {
      logger.debug(`Save local update only ${this.Class.PLURAL_NAME} was succeed. docs.count=${arrEntities.length}`);
    });
  }

  removeLocalByGuid(query: string|string[]): Promise<void> {
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
