import core from "../core";
import {BaseTable} from "./base-table";
import {SettingEntity} from "../../common/entity/setting-entity";

export class SettingTable extends BaseTable {

  static PLURAL_NAME: string = 'settings';
  static REQUIRE_USER: boolean = false;

  loadLocal(key: string): Promise<{[_id: string]: any}|any> {
    core.loggers.system.debug(`Load local ${this.Class.PLURAL_NAME} was started. key=${key}`);
    let query: Object, limit: number;
    if (key) {
      query = {_id: key};
      limit = 1;
    } else {
      query = {};
      limit = 0;
    }
    return new Promise((resolve, reject) => {
      this._datastore.find(query).sort({}).limit(limit).exec((err: Error, docs: SettingEntity[]) => {
        core.loggers.system.debug(`Load local ${this.Class.PLURAL_NAME} was ${err ? 'failed' : 'succeed'}. docs.length=${docs.length}`);
        if (err) return reject(err);
        let result: any;
        if (key) {
          result = docs.length == 0 ? null : docs[0].value;
        } else {
          result = {};
          for (var doc of docs) {
            result[doc._id] = doc.value;
          }
        }
        resolve(result);
      });
    });
  }

  saveLocal(key: string, value: Object): Promise<void> {
    let doc: SettingEntity = {_id: key, value: value};
    return new Promise<void>((resolve, reject) => {
      this._datastore.update({_id: key}, doc, {upsert: true}, (err: Error, numReplaced: number, newDoc: SettingEntity) => {
        if (err) return reject(err);
        if (this._username)
          core.users[this._username].settings[key] = value;
        else
          core.settings[key] = value;
        core.loggers.system.debug(`Upsert ${this.Class.PLURAL_NAME} end. numReplaced=${numReplaced}`);
        resolve();
      });
    });
  }

}
