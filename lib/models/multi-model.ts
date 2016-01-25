import * as async from 'async';
var merge = require('merge');

import core from '../core';
import Model from './model';

export default class MultiModel extends Model {

    DEFAULT_QUERY: Object = {};

    APPEND_QUERY: Object = {};

    DEFAULT_SORT: Object = {updated: -1};

    APPEND_SORT: Object = {};

    DEFAULT_LIMIT: number = 500;

    findLocal(options:Object, callback:(err:Error, results?:any) => void): void {
        options = this.__parseFindOptions(options);
        core.loggers.system.debug(`Find local ${this.PLURAL_NAME} was started. query=${JSON.stringify(options['query'])}, sort=${JSON.stringify(options['sort'])}, limit=${options['limit']}`);
        this._datastore.find(options['query']).sort(options['sort']).limit(options['limit']).exec((err, docs) => {
            core.loggers.system.debug(`Find local ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.length=${docs.length}`);
            callback(err, docs);
        });
    }

    countLocal(options:Object, callback:(err:Error, results?:any) => void): void {
        options = this.__parseFindOptions(options);
        core.loggers.system.debug(`Count local #{@PLURAL_NAME} was started. query=#{JSON.stringify(options.query)}`);
        this._datastore.count(options['query'], (err:Error, count:number) => {
            core.loggers.system.debug(`Count local ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. count=${count}`);
            callback(err, count);
        });
    }

    private __parseFindOptions(options:Object): Object {
        var result = {};
        // Detect options has query only or has some parameters.
        result['query'] = options['query'] || merge(true, this.DEFAULT_QUERY);
        result['sort'] = options['sort'] || merge(true, this.DEFAULT_SORT);
        result['limit'] = options['limit'] || this.DEFAULT_LIMIT;
        // If some parameter type is string, convert object.
        for (var key in ['query', 'sort']) {
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
        merge(result['query'], this.APPEND_QUERY);
        merge(result['sort'], this.APPEND_SORT);
        return result;
    }

    saveLocal(docs:Array<Object> | Object, callback:(err?:Error, results?:any) => void): void {
        var arrDocs: Array<Object>;
        if (!docs || docs['length'] == 0) return callback();
        if (!Array.isArray(docs)) arrDocs = [docs];
        core.loggers.system.debug(`Save local ${this.PLURAL_NAME} was started. docs.count=${docs['length']}`);
        async.eachSeries(arrDocs, (doc, callback) => {
            core.loggers.system.trace(`Upsert local ${this.PLURAL_NAME} was started. guid=${doc['guid']}, title=${doc[this.TITLE_FIELD]}`);
            this._datastore.update({guid: doc['guid']}, doc, {upsert: true}, (err, numReplaced, newDoc) => {
                core.loggers.system.trace(`Upsert local ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. guid=${doc['guid']}, numReplaced=${numReplaced}`);
                callback(err);
            });
        }, (err) => {
            core.loggers.system.debug(`Save local ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.count=${docs['length']}`);
            callback(err);
        });
    }

    saveLocalUpdateOnly(docs:Array<Object> | Object, callback:(err?:Error, results?:any) => void): void {
        var arrDocs:Array<Object>;
        if (!docs || docs['length'] == 0) return callback();
        if (!Array.isArray(docs)) arrDocs = [docs];
        core.loggers.system.debug(`Save local update only ${this.PLURAL_NAME} was started. docs.count=${docs['length']}`);
        async.eachSeries(arrDocs, (doc, callback) => {
            var localDoc = null;
            async.waterfall([
                (callback) => {
                    this._datastore.find({guid: doc['guid']}, callback);
                },
                (docs, callback) => {
                    localDoc = (docs.length == 0) ? null : docs[0];
                    if (localDoc && localDoc.updateSequenceNum >= doc['updateSequenceNum']) {
                        core.loggers.system.trace(`Upsert local ${this.PLURAL_NAME} was skipped. guid=${doc['guid']}, title=${doc[this.TITLE_FIELD]}`);
                        callback();
                    } else {
                        core.loggers.system.trace(`Upsert local ${this.PLURAL_NAME} was started. guid=${doc['guid']}, title=${doc[this.TITLE_FIELD]}`);
                        async.waterfall([
                            (callback) => {
                                this._datastore.db[this.PLURAL_NAME].update({guid: doc['guid']}, doc, {upsert: true}, callback);
                            },
                            (numReplaced, upsert, callback) => {
                                core.loggers.system.trace(`Upsert local ${this.PLURAL_NAME} was succeed. guid=${doc['guid']}, numReplaced=${numReplaced}`);
                                callback();
                            },
                        ], callback);
                    }
                },
            ], callback);
        }, (err) => {
            core.loggers.system.debug(`Save local update only ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.count=${docs['length']}`);
            callback(err);
        });
    }

    removeLocal(query:Array<string> | string | Object, callback:(err?: Error, results?: any) => void): void {
        if (!query) return callback();
        if (Array.isArray(query)) {
            if (query['length'] == 0) return callback();
            query = {guid: {$in: query}};
        }
        if (typeof query == 'string') {
            query = {guid: query};
        }
        core.loggers.system.debug(`Remove local ${this.PLURAL_NAME} was started. query=${JSON.stringify(query)}`);
        this._datastore.remove(query, {multi: true}, (err, numRemoved) => {
            core.loggers.system.debug(`Remove local ${this.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. numRemoved=${numRemoved}`);
            callback(err);
        });
    }

}
