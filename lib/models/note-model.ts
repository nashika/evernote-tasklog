import * as async from 'async';
var merge = require('merge');

import core from '../core';
import MultiModel from './multi-model';

export default class NoteModel extends MultiModel {

    static PLURAL_NAME:string = 'notes';
    static TITLE_FIELD:string = 'title';
    static APPEND_QUERY:Object = {deleted: null};

    findLocal(options:Object, callback:(err?:Error, results?:any) => void):void {
        super.findLocal(options, (err, notes) => {
            if (options['content']) {
                callback(null, notes);
            } else {
                var results:Array<Object> = [];
                for (var note of notes) {
                    var result = merge(true, note);
                    result.hasContent = result.content != null;
                    result.content = null;
                    results.push(result);
                }
                callback(null, results);
            }
        });
    }

    getRemoteContent(options:Object, callback:(err?:Error, results?:any) => void):void {
        this.findLocal(options, (err?:Error, notes?:Array<Object>) => {
            if (err) return callback(err);
            var result:Array<Object> = [];
            async.eachSeries(notes, (note, callback) => {
                if (note['content'] || note['hasContent']) {
                    result.push(note);
                    callback();
                } else {
                    this.loadRemote(note['guid'], (err, loadedNote) => {
                        if (err) return callback(err);
                        result.push(loadedNote);
                        // TODO: set hasContentProperty
                        callback();
                    });
                }
            }, (err) => {
                if (err) return callback(err);
                callback(null, result);
            });
        });
    }

    loadRemote(guid:string, callback:(err?:Error, results?:any) => void):void {
        core.loggers.system.debug(`Loading note from remote was started. guid=${guid}`);
        var noteStore = core.users[this._username].client.getNoteStore();
        var lastNote = null;
        async.waterfall([
            (callback) => {
                noteStore.getNote(guid, true, false, false, false, callback);
            },
            (note, callback) => {
                core.loggers.system.debug(`Loading note was succeed. guid=${note.guid} title=${note[(<typeof NoteModel>this.constructor).TITLE_FIELD]}`);
                lastNote = note;
                core.loggers.system.debug(`Saving note to local. guid=${note.guid}`);
                this._datastore.update({guid: note.guid}, note, {upsert: true}, callback);
            },
            (numReplaced, ...restArgs) => {
                var callback = restArgs.pop();
                core.loggers.system.debug(`Saving note was succeed. guid=${lastNote.guid} numReplaced=${numReplaced}`);
                callback();
            },
            (callback) => {
                this._parseNote(lastNote, callback);
            },
        ], (err) => {
            if (err) return callback(err);
            core.loggers.system.debug(`Loading note from remote was finished. note is loaded. guid=${lastNote.guid} title=${lastNote.title}`);
            callback(null, lastNote);
        });
    }

    reParseNotes(options:Object, callback:(err?:Error, results?:any) => void):void {
        if (!options) options = {};
        options['limit'] = 0;
        options['content'] = true;
        this.findLocal(options, (err, notes) => {
            if (err) return callback(err);
            async.eachSeries(notes, (note, callback) => {
                this._parseNote(note, callback);
            }, callback);
        });
    }

    _parseNote(note:Object, callback:(err?:Error, results?:any) => void):void {
        if (!note['content']) return callback();
        core.loggers.system.debug(`Parsing note was started. guid=${note['guid']}, title=${note['title']}`);
        var content:string = note['content'];
        content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
        var lines:Array<string> = [];
        for (var line of content.split('<>')) {
            lines.push(line.replace(/<[^>]*>/g, ''));
        }
        async.waterfall([
            (callback) => {
                core.users[this._username].models.timeLogs.parse(note, lines, callback);
            },
            (callback) => {
                core.users[this._username].models.profitLogs.parse(note, lines, callback);
            },
        ], (err) => {
            core.loggers.system.debug(`Parsing note was ${err ? 'failed' : 'succeed'}. guid=${note['guid']}`);
            callback(err);
        });
    }

}