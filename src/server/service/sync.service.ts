import evernote = require("evernote");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {EvernoteClientService} from "./evernote-client.service";
import {SyncStateEntity} from "../../common/entity/sync-state.entity";
import {SyncStateTable} from "../table/sync-state.table";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {NotebookTable} from "../table/notebook.table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {LinkedNotebookTable} from "../table/linked-notebook.table";
import {SearchEntity} from "../../common/entity/serch.entity";
import {SearchTable} from "../table/search.table";
import {TagEntity} from "../../common/entity/tag.entity";
import {TagTable} from "../table/tag.table";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseServerService} from "./base-server.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {SettingService} from "./setting.service";

let logger = getLogger("system");

interface IUserTimerData {
  timer?: any;
  interval?: number;
  updateCount?: number;
}

@injectable()
export class SyncService extends BaseServerService {

  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  private userTimers: {[_id: string]: IUserTimerData};

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected settingService: SettingService) {
    super();
    this.userTimers = {};
  }

  get Class(): typeof SyncService {
    return <typeof SyncService>this.constructor;
  }

  async initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    this.userTimers[globalUser.id] = {};
  }

  async sync(globalUser: GlobalUserEntity, manual: boolean): Promise<void> {
    if (!this.settingService.getUser(globalUser).persons) {
      logger.warn(`No persons setting, sync process stopped.`);
      return;
    }
    let userTimerData = this.userTimers[globalUser.id];
    clearTimeout(userTimerData.timer);
    let syncStateTable = this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser);
    let localSyncState: SyncStateEntity = await syncStateTable.findOne();
    let remoteSyncState: SyncStateEntity = await syncStateTable.loadRemote();
    // Sync process
    logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    while (localSyncState.updateCount < remoteSyncState.updateCount) {
      await this.getSyncChunk(globalUser, localSyncState);
    }
    logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    userTimerData.updateCount = localSyncState.updateCount;
    userTimerData.interval = manual ? this.Class.startInterval : Math.min(Math.round(userTimerData.interval * 1.5), this.Class.maxInterval);
    userTimerData.timer = setTimeout(() => this.sync(globalUser, false).catch(err => logger.error(err)), userTimerData.interval);
    logger.info(`Next auto reload will run after ${userTimerData.interval} msec.`);
    if (!manual) await this.autoGetNoteContent(globalUser, userTimerData.interval);
  }

  updateCount(globalUser: GlobalUserEntity): number {
    return globalUser && this.userTimers[globalUser.id] ? this.userTimers[globalUser.id].updateCount : 0;
  }

  private async getSyncChunk(globalUser: GlobalUserEntity, localSyncState: SyncStateEntity): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    let syncStateTable = this.tableService.getUserTable<SyncStateTable>(SyncStateEntity, globalUser);
    let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
    let notebookTable = this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser);
    let tagTable = this.tableService.getUserTable<TagTable>(TagEntity, globalUser);
    let searchTable = this.tableService.getUserTable<SearchTable>(SearchEntity, globalUser);
    let linkedNotebookTable = this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser);
    let lastSyncChunk: evernote.Evernote.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(globalUser, localSyncState.updateCount);
    await noteTable.saveByGuid(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
    await noteTable.removeByGuid(lastSyncChunk.expungedNotes);
    await notebookTable.saveByGuid(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
    await notebookTable.removeByGuid(lastSyncChunk.expungedNotebooks);
    await tagTable.saveByGuid(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
    await tagTable.removeByGuid(lastSyncChunk.expungedTags);
    await searchTable.saveByGuid(_.map(lastSyncChunk.searches, search => new SearchEntity(search)));
    await searchTable.removeByGuid(lastSyncChunk.expungedSearches);
    await linkedNotebookTable.saveByGuid(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
    await linkedNotebookTable.removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await syncStateTable.save(localSyncState);
    logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
  }

  private async autoGetNoteContent(globalUser: GlobalUserEntity, interval: number): Promise<void> {
    let numNote: number = Math.ceil(interval / (60 * 1000));
    let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
    logger.info(`Auto get note content was started. Number of note is ${numNote}.`);
    let notes = await noteTable.findAll({where: {content: null}, order: [["updated", "DESC"]], limit: numNote});
    for (let note of notes) {
      await noteTable.loadRemote(note.guid);
    }
    logger.info(`Auto get note content was finished.`);
  }

}
