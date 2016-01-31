import * as path from 'path';
import * as async from 'async';
import * as log4js from 'log4js';
import * as evernote from 'evernote';
import * as express from 'express';
import * as http from "http";

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
import {UserEntity} from "./models/entities/user-entity";
import {SyncStateEntity} from "./models/entities/sync-state-entity";
import {UserSetting} from "./core";
import {NoteEntity} from "./models/entities/note-entity";

class MySyncChunk extends evernote.Evernote.SyncChunk {
    notes:Array<NoteEntity>;
}

export class Www {

    SYNC_CHUNK_COUNT = 100;

    main(app:express.Application, server:http.Server):void {
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
            (callback:(err:Error) => void) => {
                core.models.settings.loadLocal(null, callback)
            },
            (settings:{[_id:string]:any}, callback:(err?:Error) => void) => {
                core.settings = settings;
                callback()
            },
        ], (err:Error) => {
            if (err) return core.loggers.error.error(`Main process failed. err=${err}`);
            core.loggers.system.info('Initialize web server finished.');
        });
    }

    initUser(username:string, token:string, sandbox:boolean, callback:(err?:Error) => void):void {
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
            (callback:(err:Error, user:UserEntity) => void) => {
                var userStore:evernote.Evernote.UserStoreClient = core.users[username].client.getUserStore();
                userStore.getUser(callback);
            },
            (user:UserEntity, callback:(err?:Error) => void) => {
                core.users[username].user = user;
                callback();
            },
            // Initialize database
            (callback:(err?:Error) => void) => {
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
            (callback:(err:Error) => void) => {
                this.sync(username, callback);
            },
        ], (err:Error) => {
            if (err) return core.loggers.error.error(`Initialize user failed. err=${err}`);
            core.loggers.system.info(`Init user finished. user:${username} data was initialized.`);
            callback();
        });
    }

    sync(username:string, callback:(err:Error, results?:any) => void):void {
        var noteStore:evernote.Evernote.NoteStoreClient = core.users[username].client.getNoteStore();
        var user:UserEntity = null;
        var localSyncState:SyncStateEntity = null;
        var remoteSyncState:SyncStateEntity = null;
        var lastSyncChunk:MySyncChunk = null;
        async.waterfall([
            // Reload settings
            (callback:(err:Error, settings:UserSetting) => void) => {
                core.users[username].models.settings.loadLocal(null, callback);
            },
            (settings:UserSetting, callback:(err?:Error) => void) => {
                core.users[username].settings = settings;
                callback();
            },
            // Reload userStore
            (callback:(err:Error, remoteUser:UserEntity) => void) => {
                core.users[username].models.users.loadRemote(callback);
            },
            (remoteUser:UserEntity, callback:(err?:Error) => void) => {
                user = remoteUser;
                callback();
            },
            (callback:(err:Error) => void) => {
                core.users[username].models.users.saveLocal(user, callback);
            },
            // Get syncState
            (callback:(err:Error, syncState:SyncStateEntity) => void) => {
                core.users[username].models.syncStates.loadLocal(callback);
            },
            (syncState:SyncStateEntity, callback:(err?:Error) => void) => {
                localSyncState = syncState;
                callback();
            },
            (callback:(err:Error, syncState:SyncStateEntity) => void) => {
                core.users[username].models.syncStates.loadRemote(callback);
            },
            (syncState:SyncStateEntity, callback:(err?:Error) => void) => {
                remoteSyncState = syncState;
                callback();
            },
            // Sync process
            (callback:(err?:Error) => void) => {
                core.loggers.system.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
                async.whilst(() => {
                    return localSyncState.updateCount < remoteSyncState.updateCount
                }, (callback:(err?:Error) => void) => {
                    core.loggers.system.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
                    var syncChunkFilter:evernote.Evernote.SyncChunkFilter = new evernote.Evernote.SyncChunkFilter();
                    syncChunkFilter.includeNotes = true;
                    syncChunkFilter.includeNotebooks = true;
                    syncChunkFilter.includeTags = true;
                    syncChunkFilter.includeSearches = true;
                    syncChunkFilter.includeExpunged = true;
                    async.waterfall([
                        (callback:(err:Error, syncChunk:MySyncChunk) => void) => {
                            noteStore.getFilteredSyncChunk(localSyncState.updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, callback)
                        },
                        (syncChunk:MySyncChunk, callback:(err?:Error) => void) => {
                            lastSyncChunk = syncChunk;
                            callback();
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.notes.saveLocal(lastSyncChunk.notes, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.notes.removeLocal(lastSyncChunk.expungedNotes, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.notebooks.saveLocal(lastSyncChunk.notebooks, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.notebooks.removeLocal(lastSyncChunk.expungedNotebooks, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.tags.saveLocal(lastSyncChunk.tags, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.tags.removeLocal(lastSyncChunk.expungedTags, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.searches.saveLocal(lastSyncChunk.searches, callback)
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.searches.removeLocal(lastSyncChunk.expungedSearches, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.linkedNotebooks.saveLocal(lastSyncChunk.linkedNotebooks, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.linkedNotebooks.removeLocal(lastSyncChunk.expungedLinkedNotebooks, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
                            callback();
                        },
                        (callback:(err?:Error) => void) => {
                            core.users[username].models.syncStates.saveLocal(localSyncState, callback);
                        },
                        (callback:(err?:Error) => void) => {
                            core.loggers.system.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
                            callback();
                        },
                    ], callback);
                }, (err:Error) => {
                    if (err) return callback(err);
                    core.loggers.system.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
                    callback();
                });
            },
        ], callback);
    }
}
