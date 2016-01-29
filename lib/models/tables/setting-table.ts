import core from '../../core';
import Table from './table';
import SettingEntity from "../entities/setting-entity";

export default class SettingTable extends Table {

    static PLURAL_NAME:string = 'settings';
    static REQUIRE_USER:boolean = false;

    loadLocal(key:string, callback:(err?:Error, result?:any) => void):void {
        core.loggers.system.debug(`Load local ${(<typeof SettingTable>this.constructor).PLURAL_NAME} was started. key=${key}`);
        var query:Object, limit:number;
        if (key) {
            query = {_id: key};
            limit = 1;
        } else {
            query = {};
            limit = 0;
        }
        this._datastore.find(query).sort({}).limit(limit).exec((err:Error, docs:Array<SettingEntity>) => {
            core.loggers.system.debug(`Load local ${(<typeof SettingTable>this.constructor).PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.length=${docs.length}`);
            if (err) return callback(err);
            var result:any;
            if (key) {
                result = docs.length == 0 ? null : docs[0].value;
            } else {
                result = {};
                for (var doc of docs) {
                    result[doc._id] = doc.value;
                }
            }
            callback(null, result);
        });
    }

    saveLocal(key:string, value:Object, callback:(err?:Error, results?:any) => void):void {
        var doc:SettingEntity = {_id: key, value: value};
        this._datastore.update({_id: key}, doc, {upsert: true}, (err:Error, numReplaced:number, newDoc:SettingEntity) => {
            if (err) return callback(err);
            if (this._username)
                core.users[this._username].settings[key] = value;
            else
                core.settings[key] = value;
            core.loggers.system.debug(`Upsert ${(<typeof SettingTable>this.constructor).PLURAL_NAME} end. numReplaced=${numReplaced}`);
            callback();
        });
    }

}
