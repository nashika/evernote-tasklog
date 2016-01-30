import * as async from 'async';
import * as evernote from "evernote";
var merge = require('merge');

import core from '../../core';
import {MultiTableOptions} from "./multi-table";
import {MultiTable} from "./multi-table";
import {NoteEntity} from "../entities/note-entity";

export interface NoteTableOptions extends MultiTableOptions {
    content?:boolean;
}

export class NoteTable extends MultiTable<NoteEntity, NoteTableOptions> {

    static PLURAL_NAME:string = 'notes';
    static TITLE_FIELD:string = 'title';
    static APPEND_QUERY:Object = {deleted: null};

    findLocal(options:NoteTableOptions, callback:(err?:Error, results?:Array<NoteEntity>) => void):void {
        super.findLocal(options, (err:Error, notes:Array<NoteEntity>) => {
            if (options.content) {
                callback(null, notes);
            } else {
                var results:Array<NoteEntity> = [];
                for (var note of notes) {
                    var result:NoteEntity = merge(true, note);
                    result.hasContent = result.content != null;
                    result.content = null;
                    results.push(result);
                }
                callback(null, results);
            }
        });
    }

    getRemoteContent(options:NoteTableOptions, callback:(err?:Error, results?:Array<NoteEntity>) => void):void {
        this.findLocal(options, (err?:Error, notes?:Array<NoteEntity>) => {
            if (err) return callback(err);
            var results:Array<NoteEntity> = [];
            async.eachSeries(notes, (note:NoteEntity, callback:(err?:Error, results?:Array<NoteEntity>) => void) => {
                if (note.content || note.hasContent) {
                    results.push(note);
                    callback();
                } else {
                    this.loadRemote(note.guid, (err?:Error, loadedNote?:NoteEntity) => {
                        if (err) return callback(err);
                        results.push(loadedNote);
                        // TODO: set hasContentProperty
                        callback();
                    });
                }
            }, (err:Error) => {
                if (err) return callback(err);
                callback(null, results);
            });
        });
    }

    loadRemote(guid:string, callback:(err?:Error, results?:NoteEntity) => void):void {
        core.loggers.system.debug(`Loading note from remote was started. guid=${guid}`);
        var noteStore:evernote.Evernote.NoteStoreClient = core.users[this._username].client.getNoteStore();
        var lastNote:NoteEntity = null;
        async.waterfall([
            (callback:(err:Error, note:NoteEntity) => void) => {
                noteStore.getNote(guid, true, false, false, false, callback);
            },
            (note:NoteEntity, callback:(err:Error, numReplaced:number) => void) => {
                core.loggers.system.debug(`Loading note was succeed. guid=${note.guid} title=${note[(<typeof NoteTable>this.constructor).TITLE_FIELD]}`);
                lastNote = note;
                core.loggers.system.debug(`Saving note to local. guid=${note.guid}`);
                this._datastore.update({guid: note.guid}, note, {upsert: true}, callback);
            },
            (numReplaced:number, ...restArgs) => {
                var callback:(err?:Error) => void = restArgs.pop();
                core.loggers.system.debug(`Saving note was succeed. guid=${lastNote.guid} numReplaced=${numReplaced}`);
                callback();
            },
            (callback:(err:Error) => void) => {
                this._parseNote(lastNote, callback);
            },
        ], (err:Error) => {
            if (err) return callback(err);
            core.loggers.system.debug(`Loading note from remote was finished. note is loaded. guid=${lastNote.guid} title=${lastNote.title}`);
            callback(null, lastNote);
        });
    }

    reParseNotes(options:NoteTableOptions, callback:(err?:Error) => void):void {
        if (!options) options = {};
        options.limit = 0;
        options.content = true;
        this.findLocal(options, (err:Error, notes:Array<NoteEntity>) => {
            if (err) return callback(err);
            async.eachSeries(notes, (note:NoteEntity, callback:(err:Error) => void) => {
                this._parseNote(note, callback);
            }, callback);
        });
    }

    protected _parseNote(note:NoteEntity, callback:(err?:Error) => void):void {
        if (!note.content) return callback();
        core.loggers.system.debug(`Parsing note was started. guid=${note.guid}, title=${note.title}`);
        var content:string = note.content;
        content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
        var lines:Array<string> = [];
        for (var line of content.split('<>')) {
            lines.push(line.replace(/<[^>]*>/g, ''));
        }
        async.waterfall([
            (callback:(err:Error) => void) => {
                core.users[this._username].models.timeLogs.parse(note, lines, callback);
            },
            (callback:(err:Error) => void) => {
                core.users[this._username].models.profitLogs.parse(note, lines, callback);
            },
        ], (err:Error) => {
            core.loggers.system.debug(`Parsing note was ${err ? 'failed' : 'succeed'}. guid=${note.guid}`);
            callback(err);
        });
    }

}
