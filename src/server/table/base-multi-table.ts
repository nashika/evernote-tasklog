import _ = require("lodash");
import {getLogger} from "log4js";

import {BaseTable} from "./base-table";
import {MyPromise} from "../../common/util/my-promise";
import {BaseMultiEntity, IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";

let logger = getLogger("system");

export class BaseMultiTable<T1 extends BaseMultiEntity, T2 extends IMultiEntityFindOptions> extends BaseTable {

  EntityClass: typeof BaseMultiEntity;

  get Class(): typeof BaseMultiTable {
    return <typeof BaseMultiTable>this.constructor;
  }

  findOne(query: Object): Promise<T1> {
    query = this.parseFindQuery(query);
    logger.debug(`Find local ${this.EntityClass.params.name} was started. query=${JSON.stringify(query)}.`);
    return new Promise((resolve, reject) => {
      this.datastore.findOne(query, (err, doc) => {
        logger.debug(`Find local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}.`);
        if (err) return reject(err);
        resolve(new (<any>this.EntityClass)(doc));
      });
    });
  }

  find(options: T2 = <any>{}): Promise<T1[]> {
    options = this.parseFindOptions(options);
    logger.debug(`Find local ${this.EntityClass.params.name} was started. query=${JSON.stringify(options.query)}, sort=${JSON.stringify(options.sort)}, limit=${options.limit}`);
    return new Promise((resolve, reject) => {
      this.datastore.find(options.query).sort(options.sort).limit(options.limit).exec((err, docs) => {
        logger.debug(`Find local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}. ${err ? "err=" + err : "docs.length=" + docs.length}`);
        if (err) return reject(err);
        resolve(_.map(docs, doc => new (<any>this.EntityClass)(doc)));
      });
    });
  }

  count(query: Object = null): Promise<number> {
    query = this.parseFindQuery(query);
    logger.debug(`Count local ${this.EntityClass.params.name} was started. query=${JSON.stringify(query)}`);
    return new Promise((resolve, reject) => {
      this.datastore.count(query, (err, count) => {
        logger.debug(`Count local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}. count=${count}`);
        if (err) return reject(err);
        resolve(count);
      });
    });
  }

  private parseFindOptions(options: T2): T2 {
    var result: any = {};
    // Detect options has query only or has some parameters.
    result.query = this.parseFindQuery(options.query);
    result.sort = options.sort || _.cloneDeep(this.EntityClass.params.default.sort);
    result.limit = options.limit || this.EntityClass.params.default.limit;
    // If some parameter type is string, convert object.
    for (var key of ["query", "sort"]) {
      switch (typeof result[key]) {
        case "object":
          result[key] = result[key];
          break;
        case "string":
          result[key] = JSON.parse(result[key]);
          break;
      }
    }
    // Merge default append parameters.
    _.merge(result.sort, this.EntityClass.params.append.sort);
    return result;
  }

  private parseFindQuery(query: Object): Object {
    let result = query || _.cloneDeep(this.EntityClass.params.default.query);
    _.merge(result, this.EntityClass.params.append.query);
    return result;
  }

  save(entities: T1|T1[]): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T1[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    logger.debug(`Save local ${this.EntityClass.params.name} was started. docs.count=${arrEntities.length}`);
    return MyPromise.eachFunctionSeries<T1>(arrEntities, (resolve, reject, entity) => {
      logger.trace(`Upsert local ${this.EntityClass.params.name} was started. _id=${entity._id}, title=${_.get(entity, this.EntityClass.params.titleField)}`);
      this.datastore.update({_id: entity._id}, entity, {upsert: true}, (err, numReplaced) => {
        logger.trace(`Upsert local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}. _id=${entity._id}, numReplaced=${numReplaced}`);
        if (err) return reject(err);
        resolve();
      });
    }).then(() => {
      logger.debug(`Save local ${this.EntityClass.params.name} was succeed. docs.count=${arrEntities.length}`);
    });
  }

  remove(query: Object): Promise<void> {
    if (!query) return Promise.resolve();
    logger.debug(`Remove local ${this.EntityClass.params.name} was started. query=${JSON.stringify(query)}`);
    return new Promise<void>((resolve, reject) => {
      this.datastore.remove(query, {multi: true}, (err, numRemoved) => {
        logger.debug(`Remove local ${this.EntityClass.params.name} was ${err ? "failed" : "succeed"}. numRemoved=${numRemoved}`);
        if (err) return reject(err);
        resolve();
      });
    });
  }

}
