var merge = require('merge');

import core from '../../core';
import Table from './table';

export default class SingleTable extends Table {

    static DEFAULT_DOC:Object = {};

    loadLocal(callback:(err?:Error, results?:any) => void):void {
        var query = {_id: 1};
        var sort = {};
        var limit = 1;
        core.loggers.system.debug(`Load local ${(<typeof SingleTable>this.constructor).PLURAL_NAME} was started.`);
        this._datastore.find(query).sort(sort).limit(limit).exec((err, docs) => {
            core.loggers.system.debug(`Load local ${(<typeof SingleTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.length=${docs.length}`);
            if (err) return callback(err);
            var doc = docs.length == 0 ? merge(true, (<typeof SingleTable>this.constructor).DEFAULT_DOC) : docs[0];
            callback(null, doc);
        });
    }

    saveLocal(doc:Object, callback:(err?:Error, results?:any) => void):void {
        doc['_id'] = 1;
        this._datastore.update({_id: 1}, doc, {upsert: true}, (err, numReplaced, newDoc) => {
            if (err) return callback(err);
            core.loggers.system.debug(`Upsert ${(<typeof SingleTable>this.constructor).PLURAL_NAME} end. numReplaced=${numReplaced}`);
            callback();
        });
    }

}
