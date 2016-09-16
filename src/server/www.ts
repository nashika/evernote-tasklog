import path = require("path");

import evernote = require("evernote");
import express = require("express");
import http = require("http");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";

import "./log4js";
import core from "./core";
import {LinkedNotebookTable} from "./table/linked-notebook-table";
import {NoteTable} from "./table/note-table";
import {NotebookTable} from "./table/notebook-table";
import {SearchTable} from "./table/search-table";
import {SettingTable} from "./table/setting-table";
import {SyncStateTable} from "./table/sync-state-table";
import {TagTable} from "./table/tag-table";
import {UserTable} from "./table/user-table";
import {UserEntity} from "../common/entity/user-entity";
import {SyncStateEntity} from "../common/entity/sync-state-entity";
import {NoteEntity} from "../common/entity/note-entity";
import {MyPromise} from "../common/util/my-promise";
import {SettingEntity} from "../common/entity/setting-entity";
import {NotebookEntity} from "../common/entity/notebook-entity";
import {TagEntity} from "../common/entity/tag-entity";
import {SearchEntity} from "../common/entity/serch-entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook-entity";
import {TableService} from "./service/table-service";

let logger = getLogger("system");

@injectable()
export class Www {

  constructor(protected tableService: TableService) {
  }

  SYNC_CHUNK_COUNT = 100;

  main(app: express.Application, server: http.Server): Promise<void> {
    // Initialize core object
    core.www = this;
    app.locals.core = core; // TODO: Set password to web server
    this.tableService.initializeGlobalTable();
    // Initialize global settings
    return this.tableService.getGlobalTable<SettingTable>(SettingEntity).find().then(settings => {
      let results:{[_id:string]: SettingEntity} = {};
      for (let setting of settings) results[setting._id] = setting;
      core.settings = results;
      logger.info("Initialize web server finished.");
    }).catch((err) => {
      logger.error(`Main process failed. err=${err}`);
    });
  }

  initUser(username: string, token: string, sandbox: boolean): Promise<void> {
    if (core.users[username]) {
      logger.info("Init user finished. already initialized.");
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
        userStore.getUser((err, user) => {
          if (err) return reject(err);
          resolve(new UserEntity(user));
        });
      })
    }).then((user: UserEntity) => {
      core.users[username].user = user;
      this.tableService.initializeUserTable(username);
      return this.sync(username);
    }).then(() => {
      logger.info(`Init user finished. user:${username} data was initialized.`);
    });
  }

  sync(username: string): Promise<void> {
    var noteStore: evernote.Evernote.NoteStoreClient = core.users[username].client.getNoteStore();
    var localSyncState: SyncStateEntity = null;
    var remoteSyncState: SyncStateEntity = null;
    var lastSyncChunk: evernote.Evernote.SyncChunk = null;
    return Promise.resolve().then(() => {
      // Reload settings
      return this.tableService.getUserTable<SettingTable>(SettingEntity, username).find().then((settings: SettingEntity[]) => {
        core.users[username].settings = <any>{};
        for (let setting of settings)
          core.users[username].settings[setting._id] = setting.value;
      });
    }).then(() => {
      // Reload userStore
      return this.tableService.getUserTable<UserTable>(UserEntity, username).loadRemote()
    }).then((remoteUser: UserEntity) => {
      return this.tableService.getUserTable<UserTable>(UserEntity, username).save(remoteUser);
    }).then(() => {
      // Get syncState
      return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, username).findOne();
    }).then((syncState: SyncStateEntity) => {
      localSyncState = syncState;
      return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, username).loadRemote();
    }).then((syncState: SyncStateEntity) => {
      remoteSyncState = syncState;
      // Sync process
      logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      return MyPromise.whilePromiseSeries(() => localSyncState.updateCount < remoteSyncState.updateCount, () => {
        logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
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
              lastSyncChunk = <any>syncChunk;
              resolve();
            });
          });
        }).then(() => {
          return this.tableService.getUserTable<NoteTable>(NoteEntity, username).saveByGuid(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
        }).then(() => {
          return this.tableService.getUserTable<NoteTable>(NoteEntity, username).removeByGuid(lastSyncChunk.expungedNotes);
        }).then(() => {
          return this.tableService.getUserTable<NotebookTable>(NotebookEntity, username).saveByGuid(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
        }).then(() => {
          return this.tableService.getUserTable<NotebookTable>(NotebookEntity, username).removeByGuid(lastSyncChunk.expungedNotebooks);
        }).then(() => {
          return this.tableService.getUserTable<TagTable>(TagEntity, username).saveByGuid(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
        }).then(() => {
          return this.tableService.getUserTable<TagTable>(TagEntity, username).removeByGuid(lastSyncChunk.expungedTags);
        }).then(() => {
          return this.tableService.getUserTable<SearchTable>(SearchEntity, username).saveByGuid(_.map(lastSyncChunk.searches, search => new SearchEntity(search)));
        }).then(() => {
          return this.tableService.getUserTable<SearchTable>(SearchEntity, username).removeByGuid(lastSyncChunk.expungedSearches);
        }).then(() => {
          return this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, username).saveByGuid(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
        }).then(() => {
          return this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, username).removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
        }).then(() => {
          localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
          return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, username).save(localSyncState);
        }).then(() => {
          logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
        });
      }).then(() => {
        logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      });
    });
  }

}
