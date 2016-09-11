import _ = require("lodash");

import core from "../core";
import {BaseTable} from "./base-table";
import {MultiEntity} from "../../common/entity/multi-entity";
import {MyPromise} from "../../common/util/my-promise";

export interface MultiTableOptions {
  query?: {[key: string]: Object}|string;
  sort?: {[key: string]: number}|string;
  limit?: number;
}

export class BaseMultiTable<T1 extends MultiEntity, T2 extends MultiTableOptions> extends BaseTable {

  static DEFAULT_QUERY: Object = {};
  static APPEND_QUERY: Object = {};
  static DEFAULT_SORT: Object = {updated: -1};
  static APPEND_SORT: Object = {};
  static DEFAULT_LIMIT: number = 500;

  get Class(): typeof BaseMultiTable {
    return <typeof BaseMultiTable>this.constructor;
  }

  findLocal(options: T2): Promise<T1[]> {
    options = this.__parseFindOptions(options);
    core.loggers.system.debug(`Find local ${this.Class.PLURAL_NAME} was started. query=${JSON.stringify(options.query)}, sort=${JSON.stringify(options.sort)}, limit=${options.limit}`);
    return new Promise((resolve, reject) => {
      this._datastore.find(options.query).sort(options.sort).limit(options.limit).exec((err: Error, docs: Array<T1>) => {
        core.loggers.system.debug(`Find local ${this.Class.PLURAL_NAME} was ${err ? "failed" : "succeed"}. ${err ? "err=" + err : "docs.length=" + docs.length}`);
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }

  countLocal(options: T2): Promise<number> {
    options = this.__parseFindOptions(options);
    core.loggers.system.debug(`Count local ${this.Class.PLURAL_NAME} was started. query=${JSON.stringify(options.query)}`);
    return new Promise((resolve, reject) => {
      this._datastore.count(options.query, (err: Error, count: number) => {
        core.loggers.system.debug(`Count local ${this.Class.PLURAL_NAME} was ${err ? "failed" : "succeed"}. count=${count}`);
        if (err) return reject(err);
        resolve(count);
      });
    });
  }

  private __parseFindOptions(options: T2): T2 {
    var result: any = {};
    // Detect options has query only or has some parameters.
    result.query = options.query || _.cloneDeep(this.Class.DEFAULT_QUERY);
    result.sort = options.sort || _.cloneDeep(this.Class.DEFAULT_SORT);
    result.limit = options.limit || this.Class.DEFAULT_LIMIT;
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
    _.merge(result.query, this.Class.APPEND_QUERY);
    _.merge(result.sort, this.Class.APPEND_SORT);
    return result;
  }

  saveLocal(docs: T1|T1[]): Promise<void> {
    if (!docs) return Promise.resolve();
    let arrDocs: T1[] = _.castArray(docs);
    if (arrDocs.length == 0) return Promise.resolve();
    core.loggers.system.debug(`Save local ${this.Class.PLURAL_NAME} was started. docs.count=${arrDocs.length}`);
    return MyPromise.eachFunctionSeries<T1>(arrDocs, (resolve, reject, doc) => {
      core.loggers.system.trace(`Upsert local ${this.Class.PLURAL_NAME} was started. guid=${doc.guid}, title=${(<any>doc)[this.Class.TITLE_FIELD]}`);
      this._datastore.update({guid: doc.guid}, doc, {upsert: true}, (err: Error, numReplaced: number) => {
        core.loggers.system.trace(`Upsert local ${this.Class.PLURAL_NAME} was ${err ? "failed" : "succeed"}. guid=${doc.guid}, numReplaced=${numReplaced}`);
        if (err) return reject(err);
        resolve();
      });
    }).then(() => {
      core.loggers.system.debug(`Save local ${this.Class.PLURAL_NAME} was succeed. docs.count=${arrDocs.length}`);
    });
  }

  saveLocalUpdateOnly(docs: T1|T1[]): Promise<void> {
    if (!docs) return Promise.resolve();
    let arrDocs: T1[] = _.castArray(docs);
    if (arrDocs.length == 0) return Promise.resolve();
    core.loggers.system.debug(`Save local update only ${this.Class.PLURAL_NAME} was started. docs.count=${arrDocs.length}`);
    async.eachSeries(arrDocs, (doc: T1, callback: (err?: Error) => void) => {
      async.waterfall([
        (callback: (err?: Error, results?: Array<T1>) => void) => {
          this._datastore.find({guid: doc.guid}, callback);
        },
        (docs: Array<T1>, callback: (err?: Error) => void) => {
          var localDoc: T1 = (docs.length == 0) ? null : docs[0];
          if (localDoc && localDoc.updateSequenceNum >= doc.updateSequenceNum) {
            core.loggers.system.trace(`Upsert local ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was skipped. guid=${doc.guid}, title=${(<any>doc)[(<typeof BaseMultiTable>this.constructor).TITLE_FIELD]}`);
            callback();
          } else {
            core.loggers.system.trace(`Upsert local ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was started. guid=${doc.guid}, title=${(<any>doc)[(<typeof BaseMultiTable>this.constructor).TITLE_FIELD]}`);
            async.waterfall([
              (callback: (err?: Error, numReplaced?: number) => void) => {
                this._datastore.db[(<typeof BaseMultiTable>this.constructor).PLURAL_NAME].update({guid: doc.guid}, doc, {upsert: true}, callback);
              },
              (numReplaced: number, ...restArgs: any[]) => {
                var callback: (err?: Error) => void = restArgs.pop();
                core.loggers.system.trace(`Upsert local ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was succeed. guid=${doc.guid}, numReplaced=${numReplaced}`);
                callback();
              },
            ], callback);
          }
        },
      ], callback);
    }, (err: Error) => {
      core.loggers.system.debug(`Save local update only ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was ${err ? "failed" : "succeed"}. docs.count=${arrDocs.length}`);
      callback(err);
    });
  }

  removeLocal(query: Array<string>|string|Object, callback: (err?: Error) => void): void {
    if (!query) return callback();
    var objQuery: Object;
    if (Array.isArray(query)) {
      if (query["length"] == 0) return callback();
      objQuery = {guid: {$in: query}};
    } else if (typeof query == "string") {
      objQuery = {guid: query};
    } else {
      objQuery = query;
    }
    core.loggers.system.debug(`Remove local ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was started. query=${JSON.stringify(objQuery)}`);
    this._datastore.remove(objQuery, {multi: true}, (err: Error, numRemoved: number) => {
      core.loggers.system.debug(`Remove local ${(<typeof BaseMultiTable>this.constructor).PLURAL_NAME} was ${err ? "failed" : "succeed"}. numRemoved=${numRemoved}`);
      callback(err);
    });
  }

}
