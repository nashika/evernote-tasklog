import * as async from 'async';
var merge = require('merge');

import DataStoreService from "./data-store";
import ProgressService from "./progress";

class DataTranscieverService {

    filterParams:{notebookGuids:Array<string>, stacks:Array<string>} = null;

    constructor(public $http:angular.IHttpService, public dataStore:DataStoreService, public progress:ProgressService) {
        this.filterParams = {
            notebookGuids: [],
            stacks: [],
        };
    }

    reload = (params = {}, callback?):void => {
        if (!callback) callback = () => {
        };
        var noteQuery = this._makeNoteQuery(params || {});
        var noteCount = 0;
        this.progress.open(10);
        async.series([
            // get user
            (callback) => {
                if (this.dataStore.user) return callback();
                this.progress.next('Getting user data.');
                this.$http.get('/user')
                    .success((data) => {
                        this.dataStore.user = data;
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // get settings
            (callback) => {
                this.progress.next('Getting settings data.');
                this.$http.get('/settings')
                    .success((data) => {
                        this.dataStore.settings = data;
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // check settings
            (callback) => {
                if (!this.dataStore.settings['persons'] || this.dataStore.settings['persons'].length == 0)
                    return callback(new Error('This app need persons setting. Please switch "Settings Page" and set your persons data.'));
                callback();
            },
            // sync
            (callback) => {
                this.progress.next('Syncing remote server.');
                this.$http.get('/sync')
                    .success(() => {
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // get notebooks
            (callback) => {
                this.progress.next('Getting notebooks data.');
                this.$http.get('/notebooks')
                    .success((data:any) => {
                        this.dataStore.notebooks = {};
                        var stackHash = {};
                        for (var notebook of data) {
                            this.dataStore.notebooks[notebook.guid] = notebook;
                            if (notebook.stack) stackHash[notebook.stack] = true;
                        }
                        this.dataStore.stacks = Object.keys(stackHash);
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    })
            },
            (callback) => {
                this.progress.next('Getting notes count.');
                this.$http.get('/notes/count', {params: {query: noteQuery}})
                    .success((data:number) => {
                        noteCount = data;
                        if (noteCount > 100)
                            if (window.confirm(`Current query find ${noteCount} notes. It is too many. Continue anyway?`))
                                callback();
                            else
                                callback(new Error('User Canceled'));
                        else
                            callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // get notes
            (callback) => {
                this.progress.next('Getting notes.');
                this.$http.get('/notes', {params: {query: noteQuery}})
                    .success((data:any) => {
                        this.dataStore.notes = {};
                        for (var note of data)
                            this.dataStore.notes[note.guid] = note;
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // get content from remote
            (callback) => {
                this.progress.next('Request remote contents.');
                var count = 0;
                async.forEachOfSeries(this.dataStore.notes, (note, noteGuid, callback) => {
                    this.progress.set(`Request remote contents. ${++count} / ${Object.keys(this.dataStore.notes).length}`);
                    if (!note.hasContent)
                        this.$http.get('/notes/get-content', {params: {query: {guid: noteGuid}}})
                            .success((data:Array<Object>) => {
                                for (note of data)
                                    this.dataStore.notes[note.guid] = note;
                                callback();
                            })
                            .error(() => {
                                callback(new Error('Error $http request'));
                            });
                    else
                        callback();
                }, (err) => {
                    callback(err);
                });
            },
            // get time logs
            (callback) => {
                this.progress.next('Getting time logs.');
                var guids:Array<string> = [];
                for (var noteGuid in this.dataStore.notes) {
                    var note = this.dataStore.notes[noteGuid];
                    guids.push(note.guid);
                }
                var timeLogQuery = this._makeTimeLogQuery(merge(true, params, {noteGuids: guids}));
                this.$http.post('/time-logs', {query: timeLogQuery})
                    .success((data:any) => {
                        this.dataStore.timeLogs = {};
                        for (var timeLog of data) {
                            if (!this.dataStore.timeLogs[timeLog.noteGuid])
                                this.dataStore.timeLogs[timeLog.noteGuid] = {};
                            this.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
                        }
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
            // get profit logs
            (callback) => {
                this.progress.next('Getting profit logs.');
                var guids:Array<string> = [];
                for (var noteGuid in this.dataStore.notes) {
                    var note = this.dataStore.notes[noteGuid];
                    guids.push(note.guid);
                }
                this.$http.post('/profit-logs', {query: {noteGuid: {$in: guids}}})
                    .success((data:any) => {
                        this.dataStore.profitLogs = {};
                        for (var profitLog of data) {
                            if (!this.dataStore.profitLogs[profitLog.noteGuid])
                                this.dataStore.profitLogs[profitLog.noteGuid] = {};
                            this.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
                        }
                        callback();
                    })
                    .error(() => {
                        callback(new Error('Error $http request'));
                    });
            },
        ], (err) => {
            if (err)
                alert(err);
            else
                this.progress.next('Done.');
            this.progress.close();
            callback(err);
        });
    }

    reParse = (callback):void => {
        if (!callback) callback = () => {
        };
        this.progress.open(2);
        this.progress.next('Re Parse notes...');
        async.waterfall([
            (callback) => {
                this.$http.get('/notes/re-parse')
                    .success((data) => {
                        callback();
                    })
                    .error((data) => {
                        callback('Error $http request');
                    });
            }], (err) => {
            this.progress.next('Done.');
            this.progress.close();
            callback(err);
        });
    };

    countNotes = (callback):void => {
        var query = this._makeNoteQuery();
        this.$http.get('/notes/count', {params: {query: query}})
            .success((data) => {
                callback(null, data);
            })
            .error(() => {
                callback('Error $http request');
            });
    };

    countTimeLogs = (callback):void => {
        var query = this._makeTimeLogQuery();
        this.$http.get('/time-logs/count', {params: {query: query}})
            .success((data) => {
                callback(null, data);
            })
            .error(() => {
                callback('Error $http request');
            });
    }

    protected _makeNoteQuery = (params:{start?:Date} = {}):Object => {
        var result = {};
        // set updated query
        if (params.start)
            merge(result, {updated: {$gte: params.start.valueOf()}});
        // check notebooks
        var notebooksHash = {};
        if (this.filterParams.notebookGuids && this.filterParams.notebookGuids.length > 0)
            for (var notebookGuid of this.filterParams.notebookGuids)
                notebooksHash[notebookGuid] = true;
        // check stacks
        if (this.filterParams.stacks && this.filterParams.stacks.length > 0)
            for (var stack of this.filterParams.stacks)
                for (let notebookGuid in this.dataStore.notebooks) {
                    var notebook = this.dataStore.notebooks[notebookGuid];
                    if (stack == notebook.stack)
                        notebooksHash[notebook.guid] = true;
                }
        // set notebooks query checked before
        var notebooksArray = Object.keys(notebooksHash);
        if (notebooksArray.length > 0)
            merge(result, {notebookGuid: {$in: notebooksArray}});
        return result;
    }

    protected _makeTimeLogQuery = (params:{start?:Date, end?:Date, noteGuids?:Array<string>} = {}):Object => {
        var result = {};
        // set date query
        if (params.start)
            merge.recursive(result, {date: {$gte: params.start.valueOf()}});
        if (params.end)
            merge.recursive(result, {date: {$lte: params.end.valueOf()}});
        // set note guids query
        if (params.noteGuids)
            merge(result, {noteGuid: {$in: params.noteGuids}});
        return result;
    }

}

angular.module('App').service('dataTransciever', ['$http', 'dataStore', 'progress', DataTranscieverService]);

export default DataTranscieverService;
