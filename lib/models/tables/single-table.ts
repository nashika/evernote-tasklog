var merge = require('merge');

import core from '../../core';
import {Table} from "./table";
import {Entity} from "../entities/entity";

export class SingleTable<T extends Entity> extends Table {

    static DEFAULT_DOC:Entity = {};

    loadLocal(callback:(err?:Error, results?:T) => void):void {
        var query:Object = {_id: '1'};
        var sort:Object = {};
        var limit:number = 1;
        core.loggers.system.debug(`Load local ${(<typeof SingleTable>this.constructor).PLURAL_NAME} was started.`);
        this._datastore.find(query).sort(sort).limit(limit).exec((err:Error, docs:Array<T>) => {
            core.loggers.system.debug(`Load local ${(<typeof SingleTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.length=${docs.length}`);
            if (err) return callback(err);
            var doc:T = docs.length == 0 ? merge(true, (<typeof SingleTable>this.constructor).DEFAULT_DOC) : docs[0];
            callback(null, doc);
        });
    }

    saveLocal(doc:T, callback:(err?:Error) => void):void {
        doc._id = '1';
        this._datastore.update({_id: '1'}, doc, {upsert: true}, (err:Error, numReplaced:number, newDoc:T) => {
            if (err) return callback(err);
            core.loggers.system.debug(`Upsert ${(<typeof SingleTable>this.constructor).PLURAL_NAME} end. numReplaced=${numReplaced}`);
            callback();
        });
    }

}
