var path = require('path');
var async = require('async');
var log4js = require('log4js');
var evernote_1 = require('evernote');
var core_1 = require('./core');
var LinkedNotebookModel = require('./models/linked-notebook-model');
var NoteModel = require('./models/note-model');
var NotebookModel = require('./models/notebook-model');
var ProfitLogsModel = require('./models/profit-log-model');
var SearchModel = require('./models/search-model');
var SettingModel = require('./models/setting-model');
var SyncStateModel = require('./models/sync-state-model');
var TagModel = require('./models/tag-model');
var TimeLogsModel = require('./models/time-log-model');
var UserModel = require('./models/user-model');
var Www = (function () {
    function Www() {
        this.SYNC_CHUNK_COUNT = 100;
    }
    Www.prototype.main = function (app, server) {
        // Initialize logger
        log4js.configure(path.normalize(__dirname + '/../log4js-config.json'), { cwd: path.normalize(__dirname + '/..') });
        core_1["default"].loggers.system = log4js.getLogger('system');
        core_1["default"].loggers.access = log4js.getLogger('access');
        core_1["default"].loggers.error = log4js.getLogger('error');
        // Initialize core object
        core_1["default"].app = app;
        core_1["default"].server = server; // TODO: Set password to web server
        core_1["default"].www = this;
        core_1["default"].app.locals.core = core_1["default"];
        core_1["default"].models.settings = new SettingModel();
        // Initialize global settings
        async.waterfall([
            function (callback) {
                core_1["default"].models.settings.loadLocal(null, callback);
            },
            function (settings, callback) {
                core_1["default"].settings = settings;
                callback();
            },
        ], function (err) {
            if (err)
                return core_1["default"].loggers.error.error(err);
            core_1["default"].loggers.system.info('Initialize web server finished.');
        });
    };
    Www.prototype.initUser = function (username, token, sandbox, callback) {
        var _this = this;
        if (core_1["default"].users[username]) {
            core_1["default"].loggers.system.info('Init user finished. already initialized.');
            callback();
        }
        core_1["default"].users[username] = {};
        // Initialize evernote client
        core_1["default"].users[username].client = new evernote_1.Evernote.Client({
            token: token,
            sandbox: sandbox
        });
        async.waterfall([
            // Initialize evernote user
            // Initialize evernote user
            function (callback) {
                var userStore = core_1["default"].users[username].client.getUserStore();
                userStore.getUser(callback);
            },
            function (user, callback) {
                core_1["default"].users[username].user = user;
                callback();
            },
            // Initialize database
            // Initialize database
            function (callback) {
                core_1["default"].users[username].models = {
                    linkedNotebooks: new LinkedNotebookModel(username),
                    notes: new NoteModel(username),
                    notebooks: new NotebookModel(username),
                    profitLogs: new ProfitLogsModel(username),
                    searches: new SearchModel(username),
                    settings: new SettingModel(username),
                    syncStates: new SyncStateModel(username),
                    tags: new TagModel(username),
                    timeLogs: new TimeLogsModel(username),
                    users: new UserModel(username)
                };
                callback();
            },
            // Initialize datas
            // Initialize datas
            function (callback) {
                _this.sync(username, callback);
            },
        ], function (err) {
            if (err)
                return core_1["default"].loggers.error.error(err);
            core_1["default"].loggers.system.info("Init user finished. user:" + username + " data was initialized.");
            callback();
        });
    };
    Www.prototype.sync = function (username, callback) {
        var _this = this;
        var noteStore = core_1["default"].users[username].client.getNoteStore();
        var user = null;
        var localSyncState = null;
        var remoteSyncState = null;
        var lastSyncChunk = null;
        async.waterfall([
            // Reload settings
            // Reload settings
            function (callback) {
                core_1["default"].users[username].models.settings.loadLocal(null, callback);
            },
            function (settings, callback) {
                core_1["default"].users[username].settings = settings;
                callback();
            },
            // Reload userStore
            // Reload userStore
            function (callback) {
                core_1["default"].users[username].models.users.loadRemote(callback);
            },
            function (remoteUser, callback) {
                user = remoteUser;
                callback();
            },
            function (callback) {
                core_1["default"].users[username].models.users.saveLocal(user, callback);
            },
            // Get syncState
            // Get syncState
            function (callback) {
                core_1["default"].users[username].models.syncStates.loadLocal(callback);
            },
            function (syncState, callback) {
                localSyncState = syncState;
                callback();
            },
            function (callback) {
                core_1["default"].users[username].models.syncStates.loadRemote(callback);
            },
            function (syncState, callback) {
                remoteSyncState = syncState;
                callback();
            },
            // Sync process
            // Sync process
            function (callback) {
                core_1["default"].loggers.system.info("Sync start. localUSN=" + localSyncState.updateCount + " remoteUSN=" + remoteSyncState.updateCount);
                async.whilst(function () {
                    return localSyncState.updateCount < remoteSyncState.updateCount;
                }, function (callback) {
                    core_1["default"].loggers.system.info("Get sync chunk start. startUSN=" + localSyncState.updateCount);
                    var syncChunkFilter = new evernote_1.Evernote.SyncChunkFilter();
                    syncChunkFilter.includeNotes = true;
                    syncChunkFilter.includeNotebooks = true;
                    syncChunkFilter.includeTags = true;
                    syncChunkFilter.includeSearches = true;
                    syncChunkFilter.includeExpunged = true;
                    async.waterfall([
                        function (callback) {
                            noteStore.getFilteredSyncChunk(localSyncState.updateCount, _this.SYNC_CHUNK_COUNT, syncChunkFilter, callback);
                        },
                        function (syncChunk, callback) {
                            lastSyncChunk = syncChunk;
                            callback();
                        },
                        function (callback) {
                            core_1["default"].users[username].models.notes.saveLocal(lastSyncChunk.notes, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.notes.removeLocal(lastSyncChunk.expungedNotes, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.notebooks.saveLocal(lastSyncChunk.notebooks, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.notebooks.removeLocal(lastSyncChunk.expungedNotebooks, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.tags.saveLocal(lastSyncChunk.tags, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.tags.removeLocal(lastSyncChunk.expungedTags, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.searches.saveLocal(lastSyncChunk.searches, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.searches.removeLocal(lastSyncChunk.expungedSearches, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.linkedNotebooks.saveLocal(lastSyncChunk.linkedNotebooks, callback);
                        },
                        function (callback) {
                            core_1["default"].users[username].models.linkedNotebooks.removeLocal(lastSyncChunk.expungedLinkedNotebooks, callback);
                        },
                        function (callback) {
                            localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
                            callback();
                        },
                        function (callback) {
                            core_1["default"].users[username].models.syncStates.saveLocal(localSyncState, callback);
                        },
                        function (callback) {
                            core_1["default"].loggers.system.info("Get sync chunk end. endUSN=" + localSyncState.updateCount);
                            callback();
                        },
                    ], callback);
                }, function (err) {
                    if (err)
                        return callback(err);
                    core_1["default"].loggers.system.info("Sync end. localUSN=" + localSyncState.updateCount + " remoteUSN=" + remoteSyncState.updateCount);
                    callback();
                });
            },
        ], callback);
    };
    return Www;
})();
module.exports = new Www();
//# sourceMappingURL=www.js.map