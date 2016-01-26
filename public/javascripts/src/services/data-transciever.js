var async = require('async');
var merge = require('merge');
var core_1 = require('../core');
var DataTranscieverService = (function () {
    function DataTranscieverService($http, dataStore, progress) {
        this.$http = $http;
        this.dataStore = dataStore;
        this.progress = progress;
        this.filterParams = null;
        this.filterParams = {
            notebookGuids: [],
            stacks: []
        };
    }
    DataTranscieverService.prototype.reload = function (params, callback) {
        var _this = this;
        if (params === void 0) { params = {}; }
        if (!callback)
            callback = function () {
            };
        var noteQuery = this._makeNoteQuery(params || {});
        var noteCount = 0;
        this.progress.open(10);
        async.series([
            // get user
            // get user
            function (callback) {
                if (_this.dataStore.user)
                    return callback();
                _this.progress.next('Getting user data.');
                _this.$http.get('/user')
                    .success(function (data) {
                    _this.dataStore.user = data;
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // get settings
            // get settings
            function (callback) {
                _this.progress.next('Getting settings data.');
                _this.$http.get('/settings')
                    .success(function (data) {
                    _this.dataStore.settings = data;
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // check settings
            // check settings
            function (callback) {
                if (!_this.dataStore.settings['persons'] || _this.dataStore.settings['persons'].length == 0)
                    return callback(new Error('This app need persons setting. Please switch "Settings Page" and set your persons data.'));
                callback();
            },
            // sync
            // sync
            function (callback) {
                _this.progress.next('Syncing remote server.');
                _this.$http.get('/sync')
                    .success(function () {
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // get notebooks
            // get notebooks
            function (callback) {
                _this.progress.next('Getting notebooks data.');
                _this.$http.get('/notebooks')
                    .success(function (data) {
                    _this.dataStore.notebooks = {};
                    var stackHash = {};
                    for (var _i = 0; _i < data.length; _i++) {
                        var notebook = data[_i];
                        _this.dataStore.notebooks[notebook.guid] = notebook;
                        if (notebook.stack)
                            stackHash[notebook.stack] = true;
                    }
                    _this.dataStore.stacks = Object.keys(stackHash);
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            function (callback) {
                _this.progress.next('Getting notes count.');
                _this.$http.get('/notes/count', { params: { query: noteQuery } })
                    .success(function (data) {
                    noteCount = data;
                    if (noteCount > 100)
                        if (window.confirm("Current query find " + noteCount + " notes. It is too many. Continue anyway?"))
                            callback();
                        else
                            callback(new Error('User Canceled'));
                    else
                        callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // get notes
            // get notes
            function (callback) {
                _this.progress.next('Getting notes.');
                _this.$http.get('/notes', { params: { query: noteQuery } })
                    .success(function (data) {
                    _this.dataStore.notes = {};
                    for (var _i = 0; _i < data.length; _i++) {
                        var note = data[_i];
                        _this.dataStore.notes[note.guid] = note;
                    }
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // get content from remote
            // get content from remote
            function (callback) {
                _this.progress.next('Request remote contents.');
                var count = 0;
                async.forEachOfSeries(_this.dataStore.notes, function (note, noteGuid, callback) {
                    _this.progress.set("Request remote contents. " + ++count + " / " + Object.keys(_this.dataStore.notes).length);
                    if (!note.hasContent)
                        _this.$http.get('/notes/get-content', { params: { query: { guid: noteGuid } } })
                            .success(function (data) {
                            for (var _i = 0; _i < data.length; _i++) {
                                note = data[_i];
                                _this.dataStore.notes[note.guid] = note;
                            }
                            callback();
                        })
                            .error(function () {
                            callback(new Error('Error $http request'));
                        });
                    else
                        callback();
                }, function (err) {
                    callback(err);
                });
            },
            // get time logs
            // get time logs
            function (callback) {
                _this.progress.next('Getting time logs.');
                var guids = [];
                for (var _i = 0, _a = _this.dataStore.notes; _i < _a.length; _i++) {
                    var note = _a[_i];
                    guids.push(note.guid);
                }
                var timeLogQuery = _this._makeTimeLogQuery(merge(true, params, { noteGuids: guids }));
                _this.$http.post('/time-logs', { query: timeLogQuery })
                    .success(function (data) {
                    _this.dataStore.timeLogs = {};
                    for (var _i = 0; _i < data.length; _i++) {
                        var timeLog = data[_i];
                        if (!_this.dataStore.timeLogs[timeLog.noteGuid])
                            _this.dataStore.timeLogs[timeLog.noteGuid] = {};
                        _this.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
                    }
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
            // get profit logs
            // get profit logs
            function (callback) {
                _this.progress.next('Getting profit logs.');
                var guids;
                for (var _i = 0, _a = _this.dataStore.notes; _i < _a.length; _i++) {
                    var note = _a[_i];
                    guids = note.guid;
                }
                _this.$http.post('/profit-logs', { query: { noteGuid: { $in: guids } } })
                    .success(function (data) {
                    _this.dataStore.profitLogs = {};
                    for (var _i = 0; _i < data.length; _i++) {
                        var profitLog = data[_i];
                        if (!_this.dataStore.profitLogs[profitLog.noteGuid])
                            _this.dataStore.profitLogs[profitLog.noteGuid] = {};
                        _this.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
                    }
                    callback();
                })
                    .error(function () {
                    callback(new Error('Error $http request'));
                });
            },
        ], function (err) {
            if (err)
                alert(err);
            else
                _this.progress.next('Done.');
            _this.progress.close();
            callback(err);
        });
    };
    DataTranscieverService.prototype.reParse = function (callback) {
        var _this = this;
        if (!callback)
            callback = function () {
            };
        this.progress.open(2);
        this.progress.next('Re Parse notes...');
        async.waterfall([
            function (callback) {
                _this.$http.get('/notes/re-parse')
                    .success(function (data) {
                    callback();
                })
                    .error(function (data) {
                    callback('Error $http request');
                });
            }], function (err) {
            _this.progress.next('Done.');
            _this.progress.close();
            callback(err);
        });
    };
    DataTranscieverService.prototype.countNotes = function (callback) {
        var query = this._makeNoteQuery();
        this.$http.get('/notes/count', { params: { query: query } })
            .success(function (data) {
            callback(null, data);
        })
            .error(function () {
            callback('Error $http request');
        });
    };
    DataTranscieverService.prototype.countTimeLogs = function (callback) {
        var query = this._makeTimeLogQuery();
        this.$http.get('/time-logs/count', { params: { query: query } })
            .success(function (data) {
            callback(null, data);
        })
            .error(function () {
            callback('Error $http request');
        });
    };
    DataTranscieverService.prototype._makeNoteQuery = function (params) {
        if (params === void 0) { params = {}; }
        var result = {};
        // set updated query
        if (params.start)
            merge(result, { updated: { $gte: params.start.valueOf() } });
        // check notebooks
        var notebooksHash = {};
        if (this.filterParams.notebookGuids && this.filterParams.notebookGuids.length > 0)
            for (var _i = 0, _a = this.filterParams.notebookGuids; _i < _a.length; _i++) {
                var notebookGuid = _a[_i];
                notebooksHash[notebookGuid] = true;
            }
        // check stacks
        if (this.filterParams.stacks && this.filterParams.stacks.length > 0)
            for (var _b = 0, _c = this.filterParams.stacks; _b < _c.length; _b++) {
                var stack = _c[_b];
                for (var _d = 0, _e = this.dataStore.notebooks; _d < _e.length; _d++) {
                    var notebook = _e[_d];
                    if (stack == notebook.stack)
                        notebooksHash[notebook.guid] = true;
                }
            }
        // set notebooks query checked before
        var notebooksArray = Object.keys(notebooksHash);
        if (notebooksArray.length > 0)
            merge(result, { notebookGuid: { $in: notebooksArray } });
        return result;
    };
    DataTranscieverService.prototype._makeTimeLogQuery = function (params) {
        if (params === void 0) { params = {}; }
        var result = {};
        // set date query
        if (params.start)
            merge.recursive(result, { date: { $gte: params.start.valueOf() } });
        if (params.end)
            merge.recursive(result, { date: { $lte: params.end.valueOf() } });
        // set note guids query
        if (params.noteGuids)
            merge(result, { noteGuid: { $in: params.noteGuids } });
        return result;
    };
    return DataTranscieverService;
})();
core_1["default"].app.service('dataTransciever', ['$http', 'dataStore', 'progress', DataTranscieverService]);
exports.__esModule = true;
exports["default"] = DataTranscieverService;
//# sourceMappingURL=data-transciever.js.map