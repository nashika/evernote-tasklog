import path = require("path");

import evernote = require("evernote");
import express = require("express");
import {Request} from "express";
import http = require("http");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table-service";
import {SettingService} from "./setting-service";
import {EvernoteClientService} from "./evernote-client-service";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";
import {UserTable} from "../table/user-table";
import {UserEntity} from "../../common/entity/user-entity";
import {SyncStateTable} from "../table/sync-state-table";
import {MyPromise} from "../../common/util/my-promise";
import {NoteTable} from "../table/note-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {NotebookTable} from "../table/notebook-table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook-entity";
import {LinkedNotebookTable} from "../table/linked-notebook-table";
import {SearchEntity} from "../../common/entity/serch-entity";
import {SearchTable} from "../table/search-table";
import {TagEntity} from "../../common/entity/tag-entity";
import {TagTable} from "../table/tag-table";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseServerService} from "./base-server-service";
import {SessionService} from "./session-service";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";
import {GlobalUserTable} from "../table/global-user-table";

let logger = getLogger("system");

@injectable()
export class MainService extends BaseServerService {

  constructor(protected tableService: TableService,
              protected settingService: SettingService,
              protected sessionService: SessionService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  initializeGlobal(): Promise<void> {
    return Promise.resolve().then(() => {
      return this.tableService.initializeGlobal();
    }).then(() => {
      return this.tableService.getGlobalTable<GlobalUserTable>(GlobalUserEntity).find();
    }).then(globalUsers => {
      return MyPromise.eachPromiseSeries(globalUsers, (globalUser: GlobalUserEntity) => {
        return this.initializeUser(globalUser);
      });
    });
  }

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    return Promise.resolve().then(() => {
      return this.evernoteClientService.initializeUser(globalUser);
    }).then(() => {
      return this.tableService.initializeUser(globalUser);
    }).then(() => {
      return this.sync(globalUser);
    }).then(() => {
      logger.info(`Init user finished. user:${globalUser._id} data was initialized.`);
    });
  }

  sync(globalUser: GlobalUserEntity): Promise<void> {
    var localSyncState: SyncStateEntity = null;
    var remoteSyncState: SyncStateEntity = null;
    var lastSyncChunk: evernote.Evernote.SyncChunk = null;
    return Promise.resolve().then(() => {
      return this.settingService.initializeUser(globalUser);
    }).then(() => {
      // Reload userStore
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).loadRemote()
    }).then((remoteUser: UserEntity) => {
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).save(remoteUser);
    }).then(() => {
      // Get syncState
      return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser).findOne();
    }).then((syncState: SyncStateEntity) => {
      localSyncState = syncState;
      return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser).loadRemote();
    }).then((syncState: SyncStateEntity) => {
      remoteSyncState = syncState;
      // Sync process
      logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      return MyPromise.whilePromiseSeries(() => localSyncState.updateCount < remoteSyncState.updateCount, () => {
        logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
        return Promise.resolve().then(() => {
          return this.evernoteClientService.getFilteredSyncChunk(globalUser, localSyncState.updateCount);
        }).then(syncChunk => {
          lastSyncChunk = <any>syncChunk;
          return this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser).saveByGuid(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
        }).then(() => {
          return this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser).removeByGuid(lastSyncChunk.expungedNotes);
        }).then(() => {
          return this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser).saveByGuid(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
        }).then(() => {
          return this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser).removeByGuid(lastSyncChunk.expungedNotebooks);
        }).then(() => {
          return this.tableService.getUserTable<TagTable>(TagEntity, globalUser).saveByGuid(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
        }).then(() => {
          return this.tableService.getUserTable<TagTable>(TagEntity, globalUser).removeByGuid(lastSyncChunk.expungedTags);
        }).then(() => {
          return this.tableService.getUserTable<SearchTable>(SearchEntity, globalUser).saveByGuid(_.map(lastSyncChunk.searches, search => new SearchEntity(search)));
        }).then(() => {
          return this.tableService.getUserTable<SearchTable>(SearchEntity, globalUser).removeByGuid(lastSyncChunk.expungedSearches);
        }).then(() => {
          return this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser).saveByGuid(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
        }).then(() => {
          return this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser).removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
        }).then(() => {
          localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
          return this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser).save(localSyncState);
        }).then(() => {
          logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
        });
      }).then(() => {
        logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      });
    });
  }

}
