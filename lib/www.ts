import * as path from 'path';
import * as async from 'async';
import * as log4js from 'log4js';
import * as evernote from 'evernote';

import core from './core';
import {LinkedNotebookTable} from "./models/tables/linked-notebook-table";
import {NoteTable} from "./models/tables/note-table";
import {NotebookTable} from "./models/tables/notebook-table";
import {ProfitLogTable} from "./models/tables/profit-log-table";
import {SearchTable} from "./models/tables/search-table";
import {SettingTable} from "./models/tables/setting-table";
import {SyncStateTable} from "./models/tables/sync-state-table";
import {TagTable} from "./models/tables/tag-table";
import {TimeLogTable} from "./models/tables/time-log-table";
import {UserTable} from "./models/tables/user-table";

export class Www {

    SYNC_CHUNK_COUNT = 100;

    main(app, server): void {
        // Initialize logger
        log4js.configure(path.normalize(__dirname + '/../log4js-config.json'), {cwd: path.normalize(__dirname + '/..')});
        core.loggers.system = log4js.getLogger('system');
        core.loggers.access = log4js.getLogger('access');
        core.loggers.error = log4js.getLogger('error');

        // Initialize core object
        core.www = this;
        app.locals.core = core; // TODO: Set password to web server
        core.models.settings = new SettingTable();
        // Initialize global settings
        async.waterfall([
            (callback) => {
                core.models.settings.loadLocal(null, callback)
            },
            (settings, callback) => {
                core.settings = settings;
                callback()
            },
        ], (err:Error) => {
            if (err) return core.loggers.error.error(`Main process failed. err=${err}`);
            core.loggers.system.info('Initialize web server finished.');
        });
    }

    initUser(username, token, sandbox, callback): void {
        if (core.users[username]) {
            core.loggers.system.info('Init user finished. already initialized.');
            callback();
        }
        core.users[username] = {};
        // Initialize evernote client
        core.users[username].client = new evernote.Evernote.Client({
            token: token,
            sandbox: sandbox,
        });
        async.waterfall([
            // Initialize evernote user
            (callback) => {
                var userStore = core.users[username].client.getUserStore();
                userStore.getUser(callback);
            },
            (user, callback) => {
                core.users[username].user = user;
                callback();
            },
            // Initialize database
            (callback) => {
                core.users[username].models = {
                    linkedNotebooks: new LinkedNotebookTable(username),
                    notes: new NoteTable(username),
                    notebooks: new NotebookTable(username),
                    profitLogs: new ProfitLogTable(username),
                    searches: new SearchTable(username),
                    settings: new SettingTable(username),
                    syncStates: new SyncStateTable(username),
                    tags: new TagTable(username),
                    timeLogs: new TimeLogTable(username),
                    users: new UserTable(username),
                };
                callback();
            },
            // Initialize datas
            (callback) => {
                this.sync(username, callback);
            },
        ], (err) => {
            if (err) return core.loggers.error.error(`Initialize user failed. err=${err}`);
            core.loggers.system.info(`Init user finished. user:${username} data was initialized.`);
            callback();
        });
    }

    sync(username: string, callback:(err:Error, results?:any) => void) : void {
        var noteStore = core.users[username].client.getNoteStore();
        var user = null;
        var localSyncState = null;
        var remoteSyncState = null;
        var lastSyncChunk = null;
        async.waterfall([
            // Reload settings
            (callback) => {
                core.users[username].models.settings.loadLocal(null, callback);
            },
            (settings, callback) => {
                core.users[username].settings = settings;
                callback();
            },
            // Reload userStore
            (callback) => {
                core.users[username].models.users.loadRemote(callback);
            },
            (remoteUser, callback) => {
                user = remoteUser;
                callback();
            },
            (callback) => {
                core.users[username].models.users.saveLocal(user, callback);
            },
            // Get syncState
            (callback) => {
                core.users[username].models.syncStates.loadLocal(callback);
            },
            (syncState, callback) => {
                localSyncState = syncState;
                callback();
            },
            (callback) => {
                core.users[username].models.syncStates.loadRemote(callback);
            },
            (syncState, callback) => {
                remoteSyncState = syncState;
                callback();
            },
            // Sync process
            (callback) => {
                core.loggers.system.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
                async.whilst(() => {
                    return localSyncState.updateCount < remoteSyncState.updateCount
                }, (callback) => {
                    core.loggers.system.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
                    var syncChunkFilter = new evernote.Evernote.SyncChunkFilter();
                    syncChunkFilter.includeNotes = true;
                    syncChunkFilter.includeNotebooks = true;
                    syncChunkFilter.includeTags = true;
                    syncChunkFilter.includeSearches = true;
                    syncChunkFilter.includeExpunged = true;
                    async.waterfall([
                        (callback) => {
                            noteStore.getFilteredSyncChunk(localSyncState.updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, callback)
                        },
                        (syncChunk, callback) => {
                            lastSyncChunk = syncChunk;
                            callback();
                        },
                        (callback) => {
                            core.users[username].models.notes.saveLocal(lastSyncChunk.notes, callback);
                        },
                        (callback) => {
                            core.users[username].models.notes.removeLocal(lastSyncChunk.expungedNotes, callback);
                        },
                        (callback) => {
                            core.users[username].models.notebooks.saveLocal(lastSyncChunk.notebooks, callback);
                        },
                        (callback) => {
                            core.users[username].models.notebooks.removeLocal(lastSyncChunk.expungedNotebooks, callback);
                        },
                        (callback) => {
                            core.users[username].models.tags.saveLocal(lastSyncChunk.tags, callback);
                        },
                        (callback) => {
                            core.users[username].models.tags.removeLocal(lastSyncChunk.expungedTags, callback);
                        },
                        (callback) => {
                            core.users[username].models.searches.saveLocal(lastSyncChunk.searches, callback)
                        },
                        (callback) => {
                            core.users[username].models.searches.removeLocal(lastSyncChunk.expungedSearches, callback);
                        },
                        (callback) => {
                            core.users[username].models.linkedNotebooks.saveLocal(lastSyncChunk.linkedNotebooks, callback);
                        },
                        (callback) => {
                            core.users[username].models.linkedNotebooks.removeLocal(lastSyncChunk.expungedLinkedNotebooks, callback);
                        },
                        (callback) => {
                            localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
                            callback();
                        },
                        (callback) => {
                            core.users[username].models.syncStates.saveLocal(localSyncState, callback);
                        },
                        (callback) => {
                            core.loggers.system.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
                            callback();
                        },
                    ], callback);
                }, (err) => {
                    if (err) return callback(err);
                    core.loggers.system.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
                    callback();
                });
            },
        ], callback);
    }
}
