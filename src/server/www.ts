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
import {SyncStateTable} from "./table/sync-state-table";
import {TagTable} from "./table/tag-table";
import {UserTable} from "./table/user-table";
import {UserEntity} from "../common/entity/user-entity";
import {SyncStateEntity} from "../common/entity/sync-state-entity";
import {NoteEntity} from "../common/entity/note-entity";
import {MyPromise} from "../common/util/my-promise";
import {NotebookEntity} from "../common/entity/notebook-entity";
import {TagEntity} from "../common/entity/tag-entity";
import {SearchEntity} from "../common/entity/serch-entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook-entity";
import {TableService} from "./service/table-service";
import {SettingService} from "./service/setting-service";
import {EvernoteClientService} from "./service/evernote-client-service";

let logger = getLogger("system");

@injectable()
export class Www {

  constructor(protected tableService: TableService,
              protected settingService: SettingService,
              protected evernoteClientService: EvernoteClientService) {
  }

  main(app: express.Application, server: http.Server): Promise<void> {
    // Initialize core object
    core.www = this;
    app.locals.core = core; // TODO: Set password to web server
    this.tableService.initializeGlobal();
    // Initialize global settings
    return this.settingService.initializeGlobal().then(() => {
      logger.info("Initialize web server finished.");
    }).catch((err) => {
      logger.error(`Main process failed. err=${err}`);
    });
  }

  initUser(username: string, token: string, sandbox: boolean): Promise<void> {
    this.evernoteClientService.initializeUser(username, token, sandbox);
    return Promise.resolve().then(() => {
      this.tableService.initializeUser(username);
      return this.sync(username);
    }).then(() => {
      logger.info(`Init user finished. user:${username} data was initialized.`);
    });
  }

  sync(username: string): Promise<void> {
    var localSyncState: SyncStateEntity = null;
    var remoteSyncState: SyncStateEntity = null;
    var lastSyncChunk: evernote.Evernote.SyncChunk = null;
    return Promise.resolve().then(() => {
      return this.settingService.initializeUser(username);
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
        return Promise.resolve().then(() => {
          return this.evernoteClientService.getFilteredSyncChunk(username, localSyncState.updateCount);
        }).then(syncChunk => {
          lastSyncChunk = <any>syncChunk;
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
