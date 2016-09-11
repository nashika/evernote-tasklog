import path = require("path");

import log4js = require("log4js");
import evernote = require("evernote");
import express = require("express");
import http = require("http");

import core from "./core";
import {LinkedNotebookTable} from "./table/linked-notebook-table";
import {NoteTable} from "./table/note-table";
import {NotebookTable} from "./table/notebook-table";
import {ProfitLogTable} from "./table/profit-log-table";
import {SearchTable} from "./table/search-table";
import {SettingTable} from "./table/setting-table";
import {SyncStateTable} from "./table/sync-state-table";
import {TagTable} from "./table/tag-table";
import {TimeLogTable} from "./table/time-log-table";
import {UserTable} from "./table/user-table";
import {UserEntity} from "../common/entity/user-entity";
import {SyncStateEntity} from "../common/entity/sync-state-entity";
import {UserSetting} from "./core";
import {NoteEntity} from "../common/entity/note-entity";
import {MyPromise} from "../common/util/my-promise";

class MySyncChunk extends evernote.Evernote.SyncChunk {
  notes: Array<NoteEntity>;
}

export class Www {

  SYNC_CHUNK_COUNT = 100;

  main(app: express.Application, server: http.Server): Promise<void> {
    // Initialize logger
    log4js.configure(path.join(__dirname, "/log4js-config.json"), {cwd: path.join(__dirname, "../../")});
    core.loggers.system = log4js.getLogger("system");
    core.loggers.access = log4js.getLogger("access");
    core.loggers.error = log4js.getLogger("error");

    // Initialize core object
    core.www = this;
    app.locals.core = core; // TODO: Set password to web server
    core.models.settings = new SettingTable();
    // Initialize global settings
    return Promise.resolve().then(() => {
      return core.models.settings.loadLocal(null);
    }).then((settings: {[_id: string]: any}) => {
      core.settings = settings;
      core.loggers.system.info("Initialize web server finished.");
    }).catch((err) => {
      core.loggers.error.error(`Main process failed. err=${err}`);
    });
  }

  initUser(username: string, token: string, sandbox: boolean): Promise<void> {
    if (core.users[username]) {
      core.loggers.system.info("Init user finished. already initialized.");
      return Promise.resolve();
    }
    core.users[username] = {};
    // Initialize evernote client
    core.users[username].client = new evernote.Evernote.Client({
      token: token,
      sandbox: sandbox,
    });
    return Promise.resolve().then(() => {
      // Initialize evernote user
      return new Promise((resolve, reject) => {
        var userStore: evernote.Evernote.UserStoreClient = core.users[username].client.getUserStore();
        userStore.getUser((err: Error, user: UserEntity) => {
          if (err) return reject(err);
          resolve(user);
        });
      })
    }).then((user: UserEntity) => {
      core.users[username].user = user;
      // Initialize database
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
      // Initialize datas
      return this.sync(username);
    }).then(() => {
      core.loggers.system.info(`Init user finished. user:${username} data was initialized.`);
    });
  }

  sync(username: string): Promise<void> {
    var noteStore: evernote.Evernote.NoteStoreClient = core.users[username].client.getNoteStore();
    var user: UserEntity = null;
    var localSyncState: SyncStateEntity = null;
    var remoteSyncState: SyncStateEntity = null;
    var lastSyncChunk: MySyncChunk = null;
    return Promise.resolve().then(() => {
      // Reload settings
      return core.users[username].models.settings.loadLocal(null);
    }).then((settings: UserSetting) => {
      core.users[username].settings = settings;
      // Reload userStore
      return core.users[username].models.users.loadRemote();
    }).then((remoteUser: UserEntity) => {
      user = remoteUser;
      return core.users[username].models.users.saveLocal(user);
    }).then(() => {
      // Get syncState
      return core.users[username].models.syncStates.loadLocal();
    }).then((syncState: SyncStateEntity) => {
      localSyncState = syncState;
      return core.users[username].models.syncStates.loadRemote();
    }).then((syncState: SyncStateEntity) => {
      remoteSyncState = syncState;
      // Sync process
      core.loggers.system.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      return MyPromise.whilePromiseSeries(() => localSyncState.updateCount < remoteSyncState.updateCount, () => {
        core.loggers.system.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
        let syncChunkFilter: evernote.Evernote.SyncChunkFilter = new evernote.Evernote.SyncChunkFilter();
        syncChunkFilter.includeNotes = true;
        syncChunkFilter.includeNotebooks = true;
        syncChunkFilter.includeTags = true;
        syncChunkFilter.includeSearches = true;
        syncChunkFilter.includeExpunged = true;
        return Promise.resolve().then(() => {
          return new Promise((resolve, reject) => {
            noteStore.getFilteredSyncChunk(localSyncState.updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, (err, syncChunk) => {
              if (err) return reject(err);
              resolve(syncChunk);
            });
          });
        }).then((syncChunk: MySyncChunk) => {
          lastSyncChunk = syncChunk;
          return core.users[username].models.notes.saveLocal(lastSyncChunk.notes);
        }).then(() => {
          return core.users[username].models.notes.removeLocal(lastSyncChunk.expungedNotes);
        }).then(() => {
          return core.users[username].models.notebooks.saveLocal(lastSyncChunk.notebooks);
        }).then(() => {
          return core.users[username].models.notebooks.removeLocal(lastSyncChunk.expungedNotebooks);
        }).then(() => {
          return core.users[username].models.tags.saveLocal(lastSyncChunk.tags);
        }).then(() => {
          return core.users[username].models.tags.removeLocal(lastSyncChunk.expungedTags);
        }).then(() => {
          return core.users[username].models.searches.saveLocal(lastSyncChunk.searches);
        }).then(() => {
          return core.users[username].models.searches.removeLocal(lastSyncChunk.expungedSearches);
        }).then(() => {
          return core.users[username].models.linkedNotebooks.saveLocal(lastSyncChunk.linkedNotebooks);
        }).then(() => {
          return core.users[username].models.linkedNotebooks.removeLocal(lastSyncChunk.expungedLinkedNotebooks);
        }).then(() => {
          localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
          return core.users[username].models.syncStates.saveLocal(localSyncState);
        }).then(() => {
          core.loggers.system.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
        });
      }).then(() => {
        core.loggers.system.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      });
    });
  }

}
