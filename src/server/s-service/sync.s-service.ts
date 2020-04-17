import { injectable } from "inversify";
import Evernote from "evernote";
import _ from "lodash";

import LinkedNotebookEntity from "~/src/common/entity/linked-notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import SavedSearchEntity from "~/src/common/entity/saved-search.entity";
import BaseSService from "~/src/server/s-service/base.s-service";
import TableSService from "~/src/server/s-service/table.s-service";
import EvernoteClientSService from "~/src/server/s-service/evernote-client.s-service";
import ConstraintSService from "~/src/server/s-service/constraint.s-service";
import SocketIoSService from "~/src/server/s-service/socket-io.s-service";
import logger from "~/src/server/logger";
import { assertIsDefined } from "~/src/common/util/assert";

@injectable()
export default class SyncSService extends BaseSService {
  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  public updateCount: number = 0;

  private nextLockPromise: Promise<void> = Promise.resolve();
  private lockResolves: Array<() => void>;
  private timer: any;
  private interval: number = SyncSService.startInterval;

  constructor(
    protected tableSService: TableSService,
    protected evernoteClientSService: EvernoteClientSService,
    protected socketIoSService: SocketIoSService,
    protected constraintSService: ConstraintSService
  ) {
    super();
    this.lockResolves = [];
  }

  get Class(): typeof SyncSService {
    return <typeof SyncSService>this.constructor;
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
      let localSyncState: Evernote.NoteStore.SyncState = await this.tableSService.optionTable.findValueByKey(
        "syncState"
      );
      if (localSyncState) localSyncState = { updateCount: 0 };
      const remoteSyncState = await this.evernoteClientSService.getSyncState();
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
      await this.tableSService.optionTable.saveValueByKey(
        "syncState",
        remoteSyncState
      );
      logger.info(
        `Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
      );
      assertIsDefined(localSyncState.updateCount);
      this.updateCount = localSyncState.updateCount;
      this.socketIoSService.emitAll("sync::updateCount", this.updateCount);
      for (const event in updateEventHash) this.socketIoSService.emitAll(event);
      if (updateEventHash["sync::updateNotes"]) {
        if ((await this.tableSService.constraintResultTable.count()) > 0)
          this.socketIoSService.emitAll("constraint::notify");
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
    const lastSyncChunk: Evernote.NoteStore.SyncChunk = await this.evernoteClientSService.getFilteredSyncChunk(
      localSyncState.updateCount
    );
    await this.tableSService.noteTable.saveAll(
      _.map(lastSyncChunk.notes, note => new NoteEntity(note))
    );
    await this.tableSService.noteTable.removeByGuid(
      lastSyncChunk.expungedNotes ?? []
    );
    await this.tableSService.notebookTable.saveAll(
      _.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook))
    );
    await this.tableSService.notebookTable.removeByGuid(
      lastSyncChunk.expungedNotebooks ?? []
    );
    await this.tableSService.tagTable.saveAll(
      _.map(lastSyncChunk.tags, tag => new TagEntity(tag))
    );
    await this.tableSService.tagTable.removeByGuid(
      lastSyncChunk.expungedTags ?? []
    );
    await this.tableSService.savedSearchTable.saveAll(
      _.map(lastSyncChunk.searches, search => new SavedSearchEntity(search))
    );
    await this.tableSService.savedSearchTable.removeByGuid(
      lastSyncChunk.expungedSearches ?? []
    );
    await this.tableSService.linkedNotebookTable.saveAll(
      _.map(
        lastSyncChunk.linkedNotebooks,
        linkedNotebook => new LinkedNotebookEntity(linkedNotebook)
      )
    );
    await this.tableSService.linkedNotebookTable.removeByGuid(
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
      await this.tableSService.reloadCache("notebook");
    }
    if (
      _.size(lastSyncChunk.tags) > 0 ||
      _.size(lastSyncChunk.expungedTags) > 0
    ) {
      updateEventHash["sync::updateTags"] = true;
      await this.tableSService.reloadCache("tag");
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
        await this.constraintSService.checkOne(new NoteEntity(note));
    if (_.size(lastSyncChunk.expungedNotes) > 0)
      for (const guid of lastSyncChunk.expungedNotes ?? [])
        await this.constraintSService.removeOne(guid);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await this.tableSService.optionTable.saveValueByKey(
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
      const notes = await this.tableSService.noteTable.findAll({
        where: { content: null },
        order: { updated: "DESC" },
        take: numNote,
      });
      for (const note of notes) {
        assertIsDefined(note.guid);
        await this.tableSService.noteTable.loadRemote(note.guid);
      }
      logger.info(`Auto get note content was finished.`);
    } finally {
      await this.unlock();
    }
  }
}
