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
  private static startInterval = 30 * 1000;
  private static increaseInterval = 1.25;
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
    this.nextLockPromise = new Promise<void>((resolve) => {
      this.lockResolves.push(resolve);
    });
    logger.trace(`sync lock count=${this.lockResolves.length}`);
    if (this.lockResolves.length >= 2) return next;
  }

  async unlock(): Promise<void> {
    if (this.lockResolves.length < 1)
      throw new Error("Unlock need to lock first.");
    logger.trace(`sync unlock count=${this.lockResolves.length}`);
    const resolve = this.lockResolves.shift();
    assertIsDefined(resolve);
    resolve();
  }

  async sync(manual: boolean): Promise<void> {
    clearTimeout(this.timer);
    await this.lock();
    let updated: boolean = false;
    try {
      let localSyncState: Evernote.NoteStore.SyncState = await this.tableService.optionTable.findValueByKey(
        "syncState"
      );
      if (!localSyncState) localSyncState = { updateCount: 0 };
      const remoteSyncState = await this.evernoteClientService.getSyncState();
      logger.debug(
        `Evernoteサーバ同期の状態を確認しました. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
      );
      if (
        (localSyncState.updateCount ?? 0) < (remoteSyncState.updateCount ?? 0)
      ) {
        const eventHash: { [event: string]: string[] } = {};
        // Sync process
        logger.info(
          `Evernoteサーバ同期を開始します. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
        );
        while (
          (localSyncState.updateCount ?? 0) < (remoteSyncState.updateCount ?? 0)
        ) {
          await this.getSyncChunk(localSyncState, eventHash);
        }
        await this.tableService.optionTable.saveValueByKey(
          "syncState",
          remoteSyncState
        );
        logger.info(
          `Evernoteサーバ同期を完了しました. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`
        );
        assertIsDefined(localSyncState.updateCount);
        this.updateCount = localSyncState.updateCount;
        this.socketIoService.emitAll("sync::updateCount", this.updateCount);
        if (_.has(eventHash, ["notebook::update", "notebook::delete"]))
          await this.tableService.reloadCache("notebook");
        if (_.has(eventHash, ["tag:update", "tag::delete"]))
          await this.tableService.reloadCache("tag");
        if (eventHash["note::update"]) {
          if ((await this.tableService.constraintResultTable.count()) > 0)
            this.socketIoService.emitAll("constraint::notify");
        }
        if (Object.keys(eventHash).length > 0) {
          this.socketIoService.emitAll("sync::update", eventHash);
          updated = true;
        }
      }
    } finally {
      await this.unlock();
      this.interval =
        manual || updated
          ? this.Class.startInterval
          : Math.min(
              Math.round(this.interval * this.Class.increaseInterval),
              this.Class.maxInterval
            );
      this.timer = setTimeout(
        () => this.sync(false).catch((err) => logger.error(err)),
        this.interval
      );
      logger.debug(
        `次回のEvernoteサーバ同期は ${this.interval} ミリ秒後に実施されます.`
      );
      await this.autoGetNoteContent(this.interval);
    }
  }

  private async getSyncChunk(
    localSyncState: Evernote.NoteStore.SyncState,
    eventHash: { [event: string]: string[] }
  ): Promise<void> {
    logger.info(
      `EvernoteサーバからSyncChunk取得を開始します. startUSN=${localSyncState.updateCount}`
    );
    assertIsDefined(localSyncState.updateCount);
    const lastSyncChunk: Evernote.NoteStore.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(
      localSyncState.updateCount
    );
    await this.tableService.noteTable.saveAll(
      _.map(lastSyncChunk.notes, (note) => new NoteEntity(note))
    );
    await this.tableService.noteTable.delete(lastSyncChunk.expungedNotes ?? []);
    await this.tableService.notebookTable.saveAll(
      _.map(lastSyncChunk.notebooks, (notebook) => new NotebookEntity(notebook))
    );
    await this.tableService.notebookTable.delete(
      lastSyncChunk.expungedNotebooks ?? []
    );
    await this.tableService.tagTable.saveAll(
      _.map(lastSyncChunk.tags, (tag) => new TagEntity(<any>tag))
    );
    await this.tableService.tagTable.delete(lastSyncChunk.expungedTags ?? []);
    await this.tableService.savedSearchTable.saveAll(
      _.map(lastSyncChunk.searches, (search) => new SavedSearchEntity(search))
    );
    await this.tableService.savedSearchTable.delete(
      lastSyncChunk.expungedSearches ?? []
    );
    await this.tableService.linkedNotebookTable.saveAll(
      _.map(
        lastSyncChunk.linkedNotebooks,
        (linkedNotebook) => new LinkedNotebookEntity(linkedNotebook)
      )
    );
    await this.tableService.linkedNotebookTable.delete(
      lastSyncChunk.expungedLinkedNotebooks ?? []
    );
    const mergeGuids = (
      updateEventHash: { [event: string]: string[] },
      event: string,
      guids: string[] | undefined
    ) => {
      if (!guids || guids.length === 0) return;
      updateEventHash[event] = updateEventHash[event]
        ? updateEventHash[event].concat(guids)
        : guids;
    };
    const mergeGuidsUpdate = (
      updateEventHash: { [event: string]: string[] },
      event: string,
      datas: { guid?: string }[] | undefined
    ) => {
      if (!datas) return;
      const guids: string[] = [];
      datas.forEach((data) => {
        if (data.guid) guids.push(data.guid);
      });
      mergeGuids(updateEventHash, event, guids);
    };
    mergeGuidsUpdate(eventHash, "note::update", lastSyncChunk.notes);
    mergeGuids(eventHash, "note::delete", lastSyncChunk.expungedNotes);
    mergeGuidsUpdate(eventHash, "notebook::update", lastSyncChunk.notebooks);
    mergeGuids(eventHash, "notebook::delete", lastSyncChunk.expungedNotebooks);
    mergeGuidsUpdate(eventHash, "tag::update", lastSyncChunk.tags);
    mergeGuids(eventHash, "tag::delete", lastSyncChunk.expungedTags);
    mergeGuidsUpdate(eventHash, "search::update", lastSyncChunk.searches);
    mergeGuids(eventHash, "search::delete", lastSyncChunk.expungedSearches);
    mergeGuidsUpdate(
      eventHash,
      "linkedNotebook::update",
      lastSyncChunk.linkedNotebooks
    );
    mergeGuids(
      eventHash,
      "linkedNotebook::delete",
      lastSyncChunk.expungedLinkedNotebooks
    );
    if ((lastSyncChunk.notes?.length ?? 0) > 0)
      for (const note of lastSyncChunk.notes ?? [])
        await this.constraintService.checkOne(new NoteEntity(note));
    if ((lastSyncChunk.expungedNotes?.length ?? 0) > 0)
      for (const guid of lastSyncChunk.expungedNotes ?? [])
        await this.constraintService.removeOne(guid);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await this.tableService.optionTable.saveValueByKey(
      "syncState",
      localSyncState
    );
    logger.info(
      `EvernoteサーバからSyncChunk取得を完了しました. endUSN=${localSyncState.updateCount}`
    );
  }

  private async autoGetNoteContent(interval: number): Promise<void> {
    await this.lock();
    try {
      const numNote: number = Math.ceil(interval / (60 * 1000));
      logger.debug(
        `自動ノート内容取得処理の状態を確認します. 取得するノートの最大数: ${numNote}.`
      );
      const notes = await this.tableService.noteTable.findAll({
        where: { content: null },
        order: { updated: "DESC" },
        take: numNote,
      });
      if (notes.length > 0) {
        logger.info(
          `自動ノート内容取得処理を開始しました. 取得するノートの数: ${notes.length}.`
        );
        for (const note of notes) {
          await this.tableService.noteTable.loadRemote(note.guid);
        }
        logger.info(`自動ノート内容取得処理を完了しました.`);
      }
    } finally {
      await this.unlock();
    }
  }
}
