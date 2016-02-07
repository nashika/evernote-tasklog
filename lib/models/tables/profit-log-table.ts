import * as async from 'async';

import core from '../../core';
import {MultiTable} from "./multi-table";
import {MultiTableOptions} from "./multi-table";
import {NoteEntity} from "../entities/note-entity";
import {ProfitLogEntity} from "../entities/profit-log-entity";

export class ProfitLogTable extends MultiTable<ProfitLogEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'profitLogs';
    static TITLE_FIELD:string = 'comment';
    static DEFAULT_LIMIT:number = 2000;

    parse(note:NoteEntity, lines:Array<string>, callback:(err:Error) => void):void {
        var profitLogs:Array<ProfitLogEntity> = [];
        for (var line of lines) {
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
            (callback:(err:Error) => void) => {
                core.users[this._username].models.profitLogs.removeLocal({noteGuid: note.guid}, callback);
            },
            (callback:(err:Error) => void) => {
                core.users[this._username].models.profitLogs.saveLocal(profitLogs, callback);
            }
        ], callback);
    }

}
