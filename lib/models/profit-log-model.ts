import * as async from 'async';

import core from '../core';
import MultiModel from './multi-model';

export default class ProfitLogModel extends MultiModel {

    static PLURAL_NAME:string = 'profitLogs';
    static TITLE_FIELD:string = 'comment';
    static DEFAULT_LIMIT:number = 2000;

    parse(note, lines, callback):void {
        var profitLogs:Array<Object> = [];
        for (var line in lines) {
            var matches: Array<string>;
            if (matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)) {
                profitLogs.push({
                    noteGuid: note.guid,
                    comment: matches[1],
                    profit: parseInt(matches[2].replace(/,/g, '')),
                });
            }
        }
        async.waterfall([
            (callback) => {
                core.users[this._username].models.profitLogs.removeLocal({noteGuid: note.guid}, callback);
            },
            (callback) => {
                core.users[this._username].models.profitLogs.saveLocal(profitLogs, callback);
            },
        ], callback);
    }

}
