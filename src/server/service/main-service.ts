import evernote = require("evernote");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";
import moment = require("moment");

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

  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  private userIntervals: {[_id: string]: NodeJS.Timer};

  constructor(protected tableService: TableService,
              protected settingService: SettingService,
              protected sessionService: SessionService,
              protected evernoteClientService: EvernoteClientService) {
    super();
    this.userIntervals = {};
  }

  get Class(): typeof MainService {
    return <typeof MainService>this.constructor;
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
      return this.settingService.initializeUser(globalUser);
    }).then(() => {
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).loadRemote()
    }).then((remoteUser: UserEntity) => {
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).save(remoteUser);
    }).then(() => {
      return this.sync(globalUser);
    }).then(() => {
      this.userIntervals[globalUser._id] = setInterval(() => this.intervalUser(globalUser), this.Class.startInterval);
      logger.info(`Init user finished. user:${globalUser._id} data was initialized.`);
    });
  }

  intervalUser(globalUser: GlobalUserEntity) {
    let syncStateTable = this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser);
    syncStateTable.findOne().then(syncState => {
      if (moment().valueOf() - syncState.lastChecked > syncState.nextInterval) {
        let nextInterval = Math.min(Math.round(syncState.nextInterval * 1.5), this.Class.maxInterval);
        this.sync(globalUser, nextInterval);
      }
    });
  }

  sync(globalUser: GlobalUserEntity, nextInterval = this.Class.startInterval): Promise<void> {
    let localSyncState: SyncStateEntity = null;
    let remoteSyncState: SyncStateEntity = null;
    let lastSyncChunk: evernote.Evernote.SyncChunk = null;
    let syncStateTable = this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser);
    return Promise.resolve().then(() => {
      return syncStateTable.findOne();
    }).then((syncState: SyncStateEntity) => {
      localSyncState = syncState;
      return syncStateTable.loadRemote();
    }).then((syncState: SyncStateEntity) => {
      remoteSyncState = syncState;
      // Sync process
      logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      return MyPromise.whilePromiseSeries(() => localSyncState.updateCount < remoteSyncState.updateCount, () => {
        logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
        let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
        let notebookTable = this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser);
        let tagTable = this.tableService.getUserTable<TagTable>(TagEntity, globalUser);
        let searchTable = this.tableService.getUserTable<SearchTable>(SearchEntity, globalUser);
        let linkedNotebookTable = this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser);
        return Promise.resolve().then(() => {
          localSyncState.lastChecked = moment().valueOf();
          localSyncState.nextInterval = this.Class.maxInterval;
          return syncStateTable.save(localSyncState);
        }).then(() => {
          return this.evernoteClientService.getFilteredSyncChunk(globalUser, localSyncState.updateCount);
        }).then(syncChunk => {
          lastSyncChunk = <any>syncChunk;
          return noteTable.saveByGuid(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
        }).then(() => {
          return noteTable.removeByGuid(lastSyncChunk.expungedNotes);
        }).then(() => {
          return notebookTable.saveByGuid(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
        }).then(() => {
          return notebookTable.removeByGuid(lastSyncChunk.expungedNotebooks);
        }).then(() => {
          return tagTable.saveByGuid(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
        }).then(() => {
          return tagTable.removeByGuid(lastSyncChunk.expungedTags);
        }).then(() => {
          return searchTable.saveByGuid(_.map(lastSyncChunk.searches, search => new SearchEntity(search)));
        }).then(() => {
          return searchTable.removeByGuid(lastSyncChunk.expungedSearches);
        }).then(() => {
          return linkedNotebookTable.saveByGuid(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
        }).then(() => {
          return linkedNotebookTable.removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
        }).then(() => {
          localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
          return syncStateTable.save(localSyncState);
        }).then(() => {
          logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
        });
      }).then(() => {
        logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
        localSyncState.lastChecked = moment().valueOf();
        localSyncState.nextInterval = nextInterval;
        return syncStateTable.save(localSyncState);
      });
    });
  }

}
