var path = require('path');
var async = require('async');
var log4js = require('log4js');
var evernote = require('evernote');
var core_1 = require('./core');
var linked_notebook_table_1 = require('./models/tables/linked-notebook-table');
var note_table_1 = require('./models/tables/note-table');
var notebook_table_1 = require('./models/tables/notebook-table');
var profit_log_table_1 = require('./models/tables/profit-log-table');
var search_table_1 = require('./models/tables/search-table');
var setting_table_1 = require('./models/tables/setting-table');
var sync_state_table_1 = require('./models/tables/sync-state-table');
var tag_table_1 = require('./models/tables/tag-table');
var time_log_table_1 = require('./models/tables/time-log-table');
var user_table_1 = require('./models/tables/user-table');
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
        core_1["default"].www = this;
        app.locals.core = core_1["default"]; // TODO: Set password to web server
        core_1["default"].models.settings = new setting_table_1["default"]();
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
                return core_1["default"].loggers.error.error("Main process failed. err=" + err);
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
        core_1["default"].users[username].client = new evernote.Evernote.Client({
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
                    linkedNotebooks: new linked_notebook_table_1["default"](username),
                    notes: new note_table_1["default"](username),
                    notebooks: new notebook_table_1["default"](username),
                    profitLogs: new profit_log_table_1["default"](username),
                    searches: new search_table_1["default"](username),
                    settings: new setting_table_1["default"](username),
                    syncStates: new sync_state_table_1["default"](username),
                    tags: new tag_table_1["default"](username),
                    timeLogs: new time_log_table_1["default"](username),
                    users: new user_table_1["default"](username)
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
                return core_1["default"].loggers.error.error("Initialize user failed. err=" + err);
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
                    var syncChunkFilter = new evernote.Evernote.SyncChunkFilter();
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
exports.Www = Www;
exports.__esModule = true;
exports["default"] = Www;
//# sourceMappingURL=www.js.map