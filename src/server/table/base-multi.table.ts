import _ = require("lodash");

import {BaseTable} from "./base.table";
import {MyPromise} from "../../common/util/my-promise";
import {BaseMultiEntity, IMultiEntityFindOptions, INedbQuery} from "../../common/entity/base-multi.entity";

export class BaseMultiTable<T1 extends BaseMultiEntity, T2 extends IMultiEntityFindOptions> extends BaseTable {

  EntityClass: typeof BaseMultiEntity;

  get Class(): typeof BaseMultiTable {
    return <typeof BaseMultiTable>this.constructor;
  }

  findOne(query: INedbQuery): Promise<T1> {
    query = this.parseFindQuery(query);
    this.message("find", ["local"], this.EntityClass.params.name, true, {query: query});
    return new Promise((resolve, reject) => {
      this.datastore.findOne(query, (err, doc) => {
        this.message("find", ["local"], this.EntityClass.params.name, false, {query: query}, err);
        if (err) return reject(err);
        resolve(new (<any>this.EntityClass)(doc));
      });
    });
  }

  find(options: T2 = <any>{}): Promise<T1[]> {
    options = this.parseFindOptions(options);
    let datastore = options.archive ? this.archiveDatastore : this.datastore;
    this.message("find", ["local"], this.EntityClass.params.name, true, {options: options});
    return new Promise((resolve, reject) => {
      datastore.find(options.query).sort(options.sort).limit(options.limit).exec((err, docs) => {
        this.message("find", ["local"], this.EntityClass.params.name, false, {"docs.length": docs.length, options: options}, err);
        if (err) return reject(err);
        resolve(_.map(docs, doc => new (<any>this.EntityClass)(doc)));
      });
    });
  }

  count(options: T2 = <any>{}): Promise<number> {
    options = this.parseFindOptions(options);
    let datastore = options.archive ? this.archiveDatastore : this.datastore;
    this.message("count", ["local"], this.EntityClass.params.name, true, options);
    return new Promise((resolve, reject) => {
      datastore.count(options.query, (err, count) => {
        this.message("count", ["local"], this.EntityClass.params.name, false, {count: count}, err);
        if (err) return reject(err);
        resolve(count);
      });
    });
  }

  private parseFindOptions(options: T2): T2 {
    let result: T2 = <any>{};
    // Detect options has query only or has some parameters.
    result.query = this.parseFindQuery(options.query);
    result.sort = options.sort || _.cloneDeep(this.EntityClass.params.default.sort);
    result.limit = options.limit || this.EntityClass.params.default.limit;
    result.archive = options.archive;
    // Merge default append parameters.
    _.merge(result.sort, this.EntityClass.params.append.sort);
    return result;
  }

  private parseFindQuery(query: INedbQuery): INedbQuery {
    let result: INedbQuery = query || _.cloneDeep(this.EntityClass.params.default.query);
    _.merge(result, this.EntityClass.params.append.query);
    return result;
  }

  save(entities: T1|T1[]): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T1[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    this.message("save", ["local"], this.EntityClass.params.name, true, {"docs.count": arrEntities.length});
    return MyPromise.eachFunctionSeries<T1>(arrEntities, (resolve, reject, entity) => {
      this.message("upsert", ["local"], this.EntityClass.params.name, true, {_id: entity._id, title: _.get(entity, this.EntityClass.params.titleField)});
      this.datastore.update({_id: entity._id}, entity, {upsert: true}, (err, numReplaced) => {
        this.message("upsert", ["local"], this.EntityClass.params.name, false, {_id: entity._id, numReplaced: numReplaced}, err);
        if (err) return reject(err);
        resolve();
      });
    }).then(() => {
      this.message("save", ["local"], this.EntityClass.params.name, false, {"docs.count": arrEntities.length});
    });
  }

  remove(query: Object): Promise<void> {
    if (!query) return Promise.resolve();
    this.message("remove", ["local"], this.EntityClass.params.name, true, {query: query});
    return new Promise<void>((resolve, reject) => {
      this.datastore.remove(query, {multi: true}, (err, numRemoved) => {
        this.message("remove", ["local"], this.EntityClass.params.name, false, {query: query, numRemoved: numRemoved}, err);
        if (err) return reject(err);
        resolve();
      });
    });
  }

}
