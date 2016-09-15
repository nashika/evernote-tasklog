import path = require("path");

import evernote = require("evernote");
import express = require("express");
import http = require("http");
import {getLogger} from "log4js";
import _ = require("lodash");

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
import {BaseTable} from "./table/base-table";
import {BaseEntity} from "../common/entity/base-entity";
import {NotebookEntity} from "../common/entity/notebook-entity";
import {TagEntity} from "../common/entity/tag-entity";
import {SearchEntity} from "../common/entity/serch-entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook-entity";
import {kernel} from "./inversify.config";

let logger = getLogger("system");

export class Www {

  SYNC_CHUNK_COUNT = 100;

  main(app: express.Application, server: http.Server): Promise<void> {
    // Initialize core object
    core.www = this;
    app.locals.core = core; // TODO: Set password to web server
    core.models.settings = <SettingTable>kernel.getNamed<BaseTable>(BaseTable, "setting");
    core.models.settings.connect();
    // Initialize global settings
    return core.models.settings.find().then(settings => {
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
      // Initialize database
      core.users[username].models = {};
      for (let table of kernel.getAll<BaseTable>(BaseTable)) {
        core.users[username].models[table.EntityClass.params.name] = table;
        table.connect(username);
      }
      // Initialize datas
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
      return this.getTable<SettingTable>(username, SettingEntity).find().then((settings: SettingEntity[]) => {
        core.users[username].settings = <any>{};
        for (let setting of settings)
          core.users[username].settings[setting._id] = setting.value;
      });
    }).then(() => {
      // Reload userStore
      return this.getTable<UserTable>(username, UserEntity).loadRemote()
    }).then((remoteUser: UserEntity) => {
      return this.getTable<UserTable>(username, UserEntity).save(remoteUser);
    }).then(() => {
      // Get syncState
      return this.getTable<SyncStateTable>(username, SyncStateEntity).findOne();
    }).then((syncState: SyncStateEntity) => {
      localSyncState = syncState;
      return this.getTable<SyncStateTable>(username, SyncStateEntity).loadRemote();
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
          return this.getTable<NoteTable>(username, NoteEntity).saveByGuid(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
        }).then(() => {
          return this.getTable<NoteTable>(username, NoteEntity).removeByGuid(lastSyncChunk.expungedNotes);
        }).then(() => {
          return this.getTable<NotebookTable>(username, NotebookEntity).saveByGuid(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
        }).then(() => {
          return this.getTable<NotebookTable>(username, NotebookEntity).removeByGuid(lastSyncChunk.expungedNotebooks);
        }).then(() => {
          return this.getTable<TagTable>(username, TagEntity).saveByGuid(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
        }).then(() => {
          return this.getTable<TagTable>(username, TagEntity).removeByGuid(lastSyncChunk.expungedTags);
        }).then(() => {
          return this.getTable<SearchTable>(username, SearchEntity).saveByGuid(_.map(lastSyncChunk.searches, search => new SearchEntity(search)));
        }).then(() => {
          return this.getTable<SearchTable>(username, SearchEntity).removeByGuid(lastSyncChunk.expungedSearches);
        }).then(() => {
          return this.getTable<LinkedNotebookTable>(username, LinkedNotebookEntity).saveByGuid(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
        }).then(() => {
          return this.getTable<LinkedNotebookTable>(username, LinkedNotebookEntity).removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
        }).then(() => {
          localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
          return this.getTable<SyncStateTable>(username, SyncStateEntity).save(localSyncState);
        }).then(() => {
          logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
        });
      }).then(() => {
        logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      });
    });
  }

  getTable<T extends BaseTable>(username: string, EntityClass: typeof BaseEntity): T {
    return <T>core.users[username].models[EntityClass.params.name];
  }

}
