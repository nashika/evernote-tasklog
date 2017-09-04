import evernote = require("evernote");
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {EvernoteClientService} from "./evernote-client.service";
import {NoteEntity} from "../../common/entity/note.entity";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {SavedSearchEntity} from "../../common/entity/saved-search.entity";
import {TagEntity} from "../../common/entity/tag.entity";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseServerService} from "./base-server.service";
import {logger} from "../logger";
import {SocketIoServerService} from "./socket-io-server-service";

@injectable()
export class SyncService extends BaseServerService {

  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  public updateCount: number = 0;

  private nextLockPromise: Promise<void>;
  private lockResolves: Array<() => void>;
  private timer: any;
  private interval: number;

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected socketIoServerService: SocketIoServerService) {
    super();
    this.lockResolves = [];
  }

  get Class(): typeof SyncService {
    return <typeof SyncService>this.constructor;
  }

  async lock(): Promise<void> {
    let next = this.nextLockPromise;
    this.nextLockPromise = new Promise<void>(resolve => {
      this.lockResolves.push(resolve);
    });
    logger.debug(`sync lock count=${this.lockResolves.length}`);
    if (this.lockResolves.length >= 2) return next;
  }

  async unlock(): Promise<void> {
    if (this.lockResolves.length < 1) throw Error("Unlock need to lock first.");
    logger.debug(`sync unlock count=${this.lockResolves.length}`);
    let resolve = this.lockResolves.shift();
    resolve();
  }

  async sync(manual: boolean): Promise<void> {
    clearTimeout(this.timer);
    await this.lock();
    try {
      let localSyncState: evernote.Evernote.SyncState = await this.tableService.optionTable.findValueByKey("syncState");
      if (!localSyncState) localSyncState = <any>{updateCount: 0};
      let remoteSyncState = await this.evernoteClientService.getSyncState();
      let updateEventHash = {};
      // Sync process
      logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      while (localSyncState.updateCount < remoteSyncState.updateCount) {
        await this.getSyncChunk(localSyncState, updateEventHash);
      }
      await this.tableService.optionTable.saveValueByKey("syncState", remoteSyncState);
      logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
      this.updateCount = localSyncState.updateCount;
      this.socketIoServerService.emitAll("sync::updateCount", this.updateCount);
      for (let event in updateEventHash)
        this.socketIoServerService.emitAll(event);
    } finally {
      await this.unlock();
      this.interval = manual ? this.Class.startInterval : Math.min(Math.round(this.interval * 1.5), this.Class.maxInterval);
      this.timer = setTimeout(() => this.sync(false).catch(err => logger.error(err)), this.interval);
      logger.info(`Next auto reload will run after ${this.interval} msec.`);
      await this.autoGetNoteContent(this.interval);
    }
  }

  private async getSyncChunk(localSyncState: evernote.Evernote.SyncState, updateEventHash: any): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    let lastSyncChunk: evernote.Evernote.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(localSyncState.updateCount);
    await this.tableService.noteTable.saveAll(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
    await this.tableService.noteTable.removeByGuid(lastSyncChunk.expungedNotes);
    await this.tableService.notebookTable.saveAll(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
    await this.tableService.notebookTable.removeByGuid(lastSyncChunk.expungedNotebooks);
    await this.tableService.tagTable.saveAll(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
    await this.tableService.tagTable.removeByGuid(lastSyncChunk.expungedTags);
    await this.tableService.savedSearchTable.saveAll(_.map(lastSyncChunk.searches, search => new SavedSearchEntity(search)));
    await this.tableService.savedSearchTable.removeByGuid(lastSyncChunk.expungedSearches);
    await this.tableService.linkedNotebookTable.saveAll(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
    await this.tableService.linkedNotebookTable.removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
    if (_.size(lastSyncChunk.notes) > 0 || _.size(lastSyncChunk.expungedNotes) > 0)
      updateEventHash["sync::updateNotes"] = true;
    if (_.size(lastSyncChunk.notebooks) > 0 || _.size(lastSyncChunk.expungedNotebooks) > 0)
      updateEventHash["sync::updateNotebooks"] = true;
    if (_.size(lastSyncChunk.tags) > 0 || _.size(lastSyncChunk.expungedTags) > 0)
      updateEventHash["sync::updateTags"] = true;
    if (_.size(lastSyncChunk.searches) > 0 || _.size(lastSyncChunk.expungedSearches) > 0)
      updateEventHash["sync::updateSearches"] = true;
    if (_.size(lastSyncChunk.linkedNotebooks) > 0 || _.size(lastSyncChunk.expungedLinkedNotebooks) > 0)
      updateEventHash["sync::updateLinkedNotebooks"] = true;
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await this.tableService.optionTable.saveValueByKey("syncState", localSyncState);
    logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
  }

  private async autoGetNoteContent(interval: number): Promise<void> {
    let numNote: number = Math.ceil(interval / (60 * 1000));
    logger.info(`Auto get note content was started. Number of note is ${numNote}.`);
    let notes = await this.tableService.noteTable.findAll({where: {content: null}, order: [["updated", "DESC"]], limit: numNote});
    for (let note of notes) {
      await this.tableService.noteTable.loadRemote(note.guid);
    }
    logger.info(`Auto get note content was finished.`);
  }

}
