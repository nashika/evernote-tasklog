import evernote = require("evernote");
import {getLogger} from "log4js";
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {EvernoteClientService} from "./evernote-client.service";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {NotebookTable} from "../table/notebook.table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {LinkedNotebookTable} from "../table/linked-notebook.table";
import {SavedSearchEntity} from "../../common/entity/saved-search.entity";
import {SavedSearchTable} from "../table/saved-search.table";
import {TagEntity} from "../../common/entity/tag.entity";
import {TagTable} from "../table/tag.table";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseServerService} from "./base-server.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {SettingService} from "./setting.service";
import {OptionTable} from "../table/option.table";
import {OptionEntity} from "../../common/entity/option.entity";

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
    if (this.userTimers[globalUser.key]) return;
    this.userTimers[globalUser.key] = {};
  }

  async sync(globalUser: GlobalUserEntity, manual: boolean): Promise<void> {
    if (!this.settingService.getUser(globalUser).persons) {
      logger.warn(`No persons setting, sync process stopped.`);
      return;
    }
    let userTimerData = this.userTimers[globalUser.key];
    clearTimeout(userTimerData.timer);
    let optionTable = this.tableService.getUserTable<OptionTable>(OptionEntity, globalUser);
    let localSyncState: evernote.Evernote.SyncState = await optionTable.findValueByKey("syncState");
    if (!localSyncState) localSyncState = <any>{updateCount: 0};
    let remoteSyncState = await this.evernoteClientService.getSyncState(globalUser);
    // Sync process
    logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    while (localSyncState.updateCount < remoteSyncState.updateCount) {
      await this.getSyncChunk(globalUser, localSyncState);
    }
    await optionTable.saveValueByKey("syncState", remoteSyncState);
    logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    userTimerData.updateCount = localSyncState.updateCount;
    userTimerData.interval = manual ? this.Class.startInterval : Math.min(Math.round(userTimerData.interval * 1.5), this.Class.maxInterval);
    userTimerData.timer = setTimeout(() => this.sync(globalUser, false).catch(err => logger.error(err)), userTimerData.interval);
    logger.info(`Next auto reload will run after ${userTimerData.interval} msec.`);
    if (!manual) await this.autoGetNoteContent(globalUser, userTimerData.interval);
  }

  updateCount(globalUser: GlobalUserEntity): number {
    return globalUser && this.userTimers[globalUser.key] ? this.userTimers[globalUser.key].updateCount : 0;
  }

  private async getSyncChunk(globalUser: GlobalUserEntity, localSyncState: evernote.Evernote.SyncState): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    let optionTable = this.tableService.getUserTable<OptionTable>(OptionEntity, globalUser);
    let noteTable = this.tableService.getUserTable<NoteTable>(NoteEntity, globalUser);
    let notebookTable = this.tableService.getUserTable<NotebookTable>(NotebookEntity, globalUser);
    let tagTable = this.tableService.getUserTable<TagTable>(TagEntity, globalUser);
    let savedSearchTable = this.tableService.getUserTable<SavedSearchTable>(SavedSearchEntity, globalUser);
    let linkedNotebookTable = this.tableService.getUserTable<LinkedNotebookTable>(LinkedNotebookEntity, globalUser);
    let lastSyncChunk: evernote.Evernote.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(globalUser, localSyncState.updateCount);
    await noteTable.saveAll(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
    await noteTable.removeByGuid(lastSyncChunk.expungedNotes);
    await notebookTable.saveAll(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
    await notebookTable.removeByGuid(lastSyncChunk.expungedNotebooks);
    await tagTable.saveAll(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
    await tagTable.removeByGuid(lastSyncChunk.expungedTags);
    await savedSearchTable.saveAll(_.map(lastSyncChunk.searches, search => new SavedSearchEntity(search)));
    await savedSearchTable.removeByGuid(lastSyncChunk.expungedSearches);
    await linkedNotebookTable.saveAll(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
    await linkedNotebookTable.removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await optionTable.saveValueByKey("syncState", localSyncState);
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
