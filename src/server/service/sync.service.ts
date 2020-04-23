import { injectable } from "inversify";
import Evernote from "evernote";
import _ from "lodash";

import LinkedNotebookEntity from "~/src/common/entity/linked-notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import SavedSearchEntity from "~/src/common/entity/saved-search.entity";
import BaseServerService from "~/src/server/service/base-server.service";
import TableService from "~/src/server/service/table.service";
import EvernoteClientService from "~/src/server/service/evernote-client.service";
import ConstraintService from "~/src/server/service/constraint.service";
import SocketIoService from "~/src/server/service/socket-io.service";
import logger from "~/src/server/logger";
import { assertIsDefined } from "~/src/common/util/assert";

@injectable()
export default class SyncService extends BaseServerService {
  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  public updateCount: number = 0;

  private nextLockPromise: Promise<void> = Promise.resolve();
  private lockResolves: Array<() => void>;
  private timer: any;
  private interval: number = SyncService.startInterval;

  constructor(
    protected tableService: TableService,
    protected evernoteClientService: EvernoteClientService,
    protected socketIoService: SocketIoService,
    protected constraintService: ConstraintService
  ) {
    super();
    this.lockResolves = [];
  }

  get Class(): typeof SyncService {
    return <typeof SyncService>this.constructor;
  }

  async lock(): Promise<void> {
    const next = this.nextLockPromise;
    this.nextLockPromise = new Promise<void>(resolve => {
      this.lockResolves.push(resolve);
    });
    logger.debug(`sync lock count=${this.lockResolves.length}`);
    if (this.lockResolves.length >= 2) return next;
  }

  async unlock(): Promise<void> {
    if (this.lockResolves.length < 1)
      throw new Error("Unlock need to lock first.");
    logger.debug(`sync unlock count=${this.lockResolves.length}`);
    const resolve = this.lockResolves.shift();
    assertIsDefined(resolve);
    resolve();
  }

  async sync(manual: boolean): Promise<void> {
    clearTimeout(this.timer);
    await this.lock();
    try {
      let localSyncState: Evernote.NoteStore.SyncState = await this.tableService.optionTable.findValueByKey(
        "syncState"
      );
      if (!localSyncState) localSyncState = { updateCount: 0 };
      const remoteSyncState = await this.evernoteClientService.getSyncState();
      const updateEventHash: { [event: string]: boolean } = {};
      // Sync process
      logger.info(
        `Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
      );
      while (
        _.defaultTo(localSyncState.updateCount, 0) <
        _.defaultTo(remoteSyncState.updateCount, 0)
      ) {
        await this.getSyncChunk(localSyncState, updateEventHash);
      }
      await this.tableService.optionTable.saveValueByKey(
        "syncState",
        remoteSyncState
      );
      logger.info(
        `Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
      );
      assertIsDefined(localSyncState.updateCount);
      this.updateCount = localSyncState.updateCount;
      this.socketIoService.emitAll("sync::updateCount", this.updateCount);
      for (const event in updateEventHash) this.socketIoService.emitAll(event);
      if (updateEventHash["sync::updateNotes"]) {
        if ((await this.tableService.constraintResultTable.count()) > 0)
          this.socketIoService.emitAll("constraint::notify");
      }
    } finally {
      await this.unlock();
      this.interval = manual
        ? this.Class.startInterval
        : Math.min(Math.round(this.interval * 1.5), this.Class.maxInterval);
      this.timer = setTimeout(
        () => this.sync(false).catch(err => logger.error(err)),
        this.interval
      );
      logger.info(`Next auto reload will run after ${this.interval} msec.`);
      await this.autoGetNoteContent(this.interval);
    }
  }

  private async getSyncChunk(
    localSyncState: Evernote.NoteStore.SyncState,
    updateEventHash: { [event: string]: boolean }
  ): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    assertIsDefined(localSyncState.updateCount);
    const lastSyncChunk: Evernote.NoteStore.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(
      localSyncState.updateCount
    );
    await this.tableService.noteTable.saveAll(
      _.map(lastSyncChunk.notes, note => new NoteEntity(note))
    );
    await this.tableService.noteTable.delete(lastSyncChunk.expungedNotes ?? []);
    await this.tableService.notebookTable.saveAll(
      _.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook))
    );
    await this.tableService.notebookTable.delete(
      lastSyncChunk.expungedNotebooks ?? []
    );
    await this.tableService.tagTable.saveAll(
      _.map(lastSyncChunk.tags, tag => new TagEntity(tag))
    );
    await this.tableService.tagTable.delete(lastSyncChunk.expungedTags ?? []);
    await this.tableService.savedSearchTable.saveAll(
      _.map(lastSyncChunk.searches, search => new SavedSearchEntity(search))
    );
    await this.tableService.savedSearchTable.delete(
      lastSyncChunk.expungedSearches ?? []
    );
    await this.tableService.linkedNotebookTable.saveAll(
      _.map(
        lastSyncChunk.linkedNotebooks,
        linkedNotebook => new LinkedNotebookEntity(linkedNotebook)
      )
    );
    await this.tableService.linkedNotebookTable.delete(
      lastSyncChunk.expungedLinkedNotebooks ?? []
    );
    if (
      _.size(lastSyncChunk.notes) > 0 ||
      _.size(lastSyncChunk.expungedNotes) > 0
    )
      updateEventHash["sync::updateNotes"] = true;
    if (
      _.size(lastSyncChunk.notebooks) > 0 ||
      _.size(lastSyncChunk.expungedNotebooks) > 0
    ) {
      updateEventHash["sync::updateNotebooks"] = true;
      await this.tableService.reloadCache("notebook");
    }
    if (
      _.size(lastSyncChunk.tags) > 0 ||
      _.size(lastSyncChunk.expungedTags) > 0
    ) {
      updateEventHash["sync::updateTags"] = true;
      await this.tableService.reloadCache("tag");
    }
    if (
      _.size(lastSyncChunk.searches) > 0 ||
      _.size(lastSyncChunk.expungedSearches) > 0
    )
      updateEventHash["sync::updateSearches"] = true;
    if (
      _.size(lastSyncChunk.linkedNotebooks) > 0 ||
      _.size(lastSyncChunk.expungedLinkedNotebooks) > 0
    )
      updateEventHash["sync::updateLinkedNotebooks"] = true;
    if (_.size(lastSyncChunk.notes) > 0)
      for (const note of lastSyncChunk.notes ?? [])
        await this.constraintService.checkOne(new NoteEntity(note));
    if (_.size(lastSyncChunk.expungedNotes) > 0)
      for (const guid of lastSyncChunk.expungedNotes ?? [])
        await this.constraintService.removeOne(guid);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await this.tableService.optionTable.saveValueByKey(
      "syncState",
      localSyncState
    );
    logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
  }

  private async autoGetNoteContent(interval: number): Promise<void> {
    await this.lock();
    try {
      const numNote: number = Math.ceil(interval / (60 * 1000));
      logger.info(
        `Auto get note content was started. Number of note is ${numNote}.`
      );
      const notes = await this.tableService.noteTable.findAll({
        where: { content: null },
        order: { updated: "DESC" },
        take: numNote,
      });
      for (const note of notes) {
        await this.tableService.noteTable.loadRemote(note.guid);
      }
      logger.info(`Auto get note content was finished.`);
    } finally {
      await this.unlock();
    }
  }
}
