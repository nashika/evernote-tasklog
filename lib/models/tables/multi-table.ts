import * as async from 'async';
var merge = require('merge');

import core from '../../core';
import {Table} from "./table";
import {MultiEntity} from "../entities/multi-entity";

export interface MultiTableOptions {
    query?:{[key:string]:Object}|string;
    sort?:{[key:string]:number}|string;
    limit?:number;
}

export class MultiTable<T1 extends MultiEntity, T2 extends MultiTableOptions> extends Table {

    static DEFAULT_QUERY:Object = {};
    static APPEND_QUERY:Object = {};
    static DEFAULT_SORT:Object = {updated: -1};
    static APPEND_SORT:Object = {};
    static DEFAULT_LIMIT:number = 500;

    findLocal(options:T2, callback:(err:Error, results?:Array<T1>) => void):void {
        options = this.__parseFindOptions(options);
        core.loggers.system.debug(`Find local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. query=${JSON.stringify(options.query)}, sort=${JSON.stringify(options.sort)}, limit=${options.limit}`);
        this._datastore.find(options.query).sort(options.sort).limit(options.limit).exec((err:Error, docs:Array<T1>) => {
            core.loggers.system.debug(`Find local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. ${err ? 'err=' + err : 'docs.length=' + docs.length}`);
            callback(err, docs);
        });
    }

    countLocal(options:T2, callback:(err:Error, results?:number) => void):void {
        options = this.__parseFindOptions(options);
        core.loggers.system.debug(`Count local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. query=${JSON.stringify(options.query)}`);
        this._datastore.count(options.query, (err:Error, count:number) => {
            core.loggers.system.debug(`Count local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. count=${count}`);
            callback(err, count);
        });
    }

    private __parseFindOptions(options:T2):T2 {
        var result:T2 = <T2>{};
        // Detect options has query only or has some parameters.
        result.query = options.query || merge(true, (<typeof MultiTable>this.constructor).DEFAULT_QUERY);
        result.sort = options.sort || merge(true, (<typeof MultiTable>this.constructor).DEFAULT_SORT);
        result.limit = options.limit || (<typeof MultiTable>this.constructor).DEFAULT_LIMIT;
        // If some parameter type is string, convert object.
        for (var key of ['query', 'sort']) {
            switch (typeof result[key]) {
                case 'object':
                    result[key] = result[key];
                    break;
                case 'string':
                    result[key] = JSON.parse(result[key]);
                    break;
            }
        }
        // Merge default append parameters.
        merge(result.query, (<typeof MultiTable>this.constructor).APPEND_QUERY);
        merge(result.sort, (<typeof MultiTable>this.constructor).APPEND_SORT);
        return result;
    }

    saveLocal(docs:Array<T1>|T1, callback:(err?:Error) => void):void {
        if (!docs) return callback();
        var arrDocs:Array<T1> = (Array.isArray(docs)) ? docs : [docs];
        if (arrDocs.length == 0) return callback();
        core.loggers.system.debug(`Save local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. docs.count=${arrDocs.length}`);
        async.eachSeries(arrDocs, (doc:T1, callback:(err?:Error) => void) => {
            core.loggers.system.trace(`Upsert local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. guid=${doc.guid}, title=${doc[(<typeof MultiTable>this.constructor).TITLE_FIELD]}`);
            this._datastore.update({guid: doc.guid}, doc, {upsert: true}, (err:Error, numReplaced:number, ...restArgs) => {
                core.loggers.system.trace(`Upsert local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. guid=${doc.guid}, numReplaced=${numReplaced}`);
                callback(err);
            });
        }, (err:Error) => {
            core.loggers.system.debug(`Save local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.count=${arrDocs.length}`);
            callback(err);
        });
    }

    saveLocalUpdateOnly(docs:Array<T1>|T1, callback:(err?:Error) => void):void {
        var arrDocs:Array<T1>;
        if (!docs || docs['length'] == 0) return callback();
        if (!Array.isArray(docs)) arrDocs = [docs];
        core.loggers.system.debug(`Save local update only ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. docs.count=${arrDocs.length}`);
        async.eachSeries(arrDocs, (doc:T1, callback:(err?:Error) => void) => {
            async.waterfall([
                (callback:(err?:Error, results?:Array<T1>) => void) => {
                    this._datastore.find({guid: doc.guid}, callback);
                },
                (docs:Array<T1>, callback:(err?:Error) => void) => {
                    var localDoc:T1 = (docs.length == 0) ? null : docs[0];
                    if (localDoc && localDoc.updateSequenceNum >= doc.updateSequenceNum) {
                        core.loggers.system.trace(`Upsert local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was skipped. guid=${doc.guid}, title=${doc[(<typeof MultiTable>this.constructor).TITLE_FIELD]}`);
                        callback();
                    } else {
                        core.loggers.system.trace(`Upsert local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. guid=${doc.guid}, title=${doc[(<typeof MultiTable>this.constructor).TITLE_FIELD]}`);
                        async.waterfall([
                            (callback:(err?:Error, numReplaced?:number, ...restArgs) => void) => {
                                this._datastore.db[(<typeof MultiTable>this.constructor).PLURAL_NAME].update({guid: doc.guid}, doc, {upsert: true}, callback);
                            },
                            (numReplaced:number, ...restArgs) => {
                                var callback:(err?:Error) => void = restArgs.pop();
                                core.loggers.system.trace(`Upsert local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was succeed. guid=${doc.guid}, numReplaced=${numReplaced}`);
                                callback();
                            },
                        ], callback);
                    }
                },
            ], callback);
        }, (err:Error) => {
            core.loggers.system.debug(`Save local update only ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.count=${arrDocs.length}`);
            callback(err);
        });
    }

    removeLocal(query:Array<string>|string|Object, callback:(err?:Error) => void):void {
        if (!query) return callback();
        var objQuery:Object;
        if (Array.isArray(query)) {
            if (query['length'] == 0) return callback();
            objQuery = {guid: {$in: query}};
        } else if (typeof query == 'string') {
            objQuery = {guid: query};
        } else {
            objQuery = query;
        }
        core.loggers.system.debug(`Remove local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was started. query=${JSON.stringify(objQuery)}`);
        this._datastore.remove(objQuery, {multi: true}, (err:Error, numRemoved:number) => {
            core.loggers.system.debug(`Remove local ${(<typeof MultiTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. numRemoved=${numRemoved}`);
            callback(err);
        });
    }

}
