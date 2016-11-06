import evernote = require("evernote");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table-service";
import {EvernoteClientService} from "./evernote-client-service";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";
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
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

let logger = getLogger("system");

interface IUserTimerData {
  timer?: NodeJS.Timer;
  interval?: number;
  updateCount?: number;
}

@injectable()
export class SyncService extends BaseServerService {

  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  private userTimers: {[_id: string]: IUserTimerData};

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
    this.userTimers = {};
  }

  get Class(): typeof SyncService {
    return <typeof SyncService>this.constructor;
  }

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    this.userTimers[globalUser._id] = {};
    return Promise.resolve();
  }

  sync(globalUser: GlobalUserEntity, manualReload: boolean): Promise<void> {
    let userTimerData = this.userTimers[globalUser._id];
    clearTimeout(userTimerData.timer);
    let localSyncState: SyncStateEntity = null;
    let remoteSyncState: SyncStateEntity = null;
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
        return this.getSyncChunk(globalUser, localSyncState);
      });
    }).then(() => {
      logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      userTimerData.updateCount = localSyncState.updateCount;
      userTimerData.interval = manualReload ? this.Class.startInterval : Math.min(Math.round(userTimerData.interval * 1.5), this.Class.maxInterval);
      userTimerData.timer = setTimeout(() => this.sync(globalUser, false), userTimerData.interval);
      logger.info(`Next auto reload will run after ${userTimerData.interval} msec.`);
      if (!manualReload) return this.autoGetNoteContent(globalUser, userTimerData.interval);
      return Promise.resolve();
    });
  }

  updateCount(globalUser: GlobalUserEntity): number {
    return this.userTimers[globalUser._id] ? this.userTimers[globalUser._id].updateCount : 0;
  }

  private getSyncChunk(globalUser: GlobalUserEntity, localSyncState: SyncStateEntity): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    let lastSyncChunk: evernote.Evernote.SyncChunk = null;
    let syncStateTable = this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser);
    let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
    let notebookTable = this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser);
    let tagTable = this.tableService.getUserTable<TagTable>(TagEntity, globalUser);
    let searchTable = this.tableService.getUserTable<SearchTable>(SearchEntity, globalUser);
    let linkedNotebookTable = this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser);
    return Promise.resolve().then(() => {
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
  }

  private autoGetNoteContent(globalUser: GlobalUserEntity, interval: number): Promise<void> {
    let numNote: number = Math.ceil(interval / (60 * 1000));
    let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
    logger.info(`Auto get note content was started. Number of note is ${numNote}.`);
    return Promise.resolve().then(() => {
      return noteTable.find({query: {content: null}, sort: {updated: -1}, limit: numNote});
    }).then(notes => {
      return MyPromise.eachPromiseSeries(notes, (note: NoteEntity) => {
        return noteTable.loadRemote(note.guid);
      });
    }).then(() => {
      logger.info(`Auto get note content was finished.`);
    });
  }

}
