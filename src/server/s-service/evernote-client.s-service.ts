import { injectable } from "inversify";
import Evernote from "evernote";

import NoteEntity from "~/src/common/entity/note.entity";
import configLoader from "~/src/common/util/config-loader";
import BaseSService from "~/src/server/s-service/base.s-service";
import { assertIsDefined } from "~/src/common/util/assert";
import logger from "~/src/server/logger";

@injectable()
export default class EvernoteClientSService extends BaseSService {
  SYNC_CHUNK_COUNT = 100;

  private _client: Evernote.Client | null = null;

  private get client(): Evernote.Client {
    assertIsDefined(this._client);
    return this._client;
  }

  async initialize(): Promise<void> {
    this._client = new Evernote.Client({
      token: configLoader.app.token,
      sandbox: configLoader.app.sandbox,
    });
  }

  async getUser(): Promise<Evernote.Types.User> {
    this.mes_(true, "user", {});
    try {
      const user = await this.client.getUserStore().getUser();
      this.mes_(false, "user", {});
      return user;
    } catch (err) {
      this.mes_(false, "user", {}, err);
      throw err;
    }
  }

  async getSyncState(): Promise<Evernote.NoteStore.SyncState> {
    this.mes_(true, "syncState");
    try {
      const syncState = await this.client.getNoteStore().getSyncState();
      this.mes_(false, "syncState");
      return syncState;
    } catch (err) {
      this.mes_(false, "syncState", err);
      throw err;
    }
  }

  async getFilteredSyncChunk(
    updateCount: number
  ): Promise<Evernote.NoteStore.SyncChunk> {
    const syncChunkFilter: Evernote.NoteStore.SyncChunkFilter = new Evernote.NoteStore.SyncChunkFilter();
    syncChunkFilter.includeNotes = true;
    syncChunkFilter.includeNotebooks = true;
    syncChunkFilter.includeTags = true;
    syncChunkFilter.includeSearches = true;
    syncChunkFilter.includeExpunged = true;
    this.mes_(true, "syncChunk", { startUSN: updateCount });
    try {
      const syncChunk = await this.client
        .getNoteStore()
        .getFilteredSyncChunk(
          updateCount,
          this.SYNC_CHUNK_COUNT,
          syncChunkFilter
        );
      this.mes_(false, "syncChunk", { startUSN: updateCount });
      return syncChunk;
    } catch (err) {
      this.mes_(false, "syncChunk", { startUSN: updateCount }, err);
      throw err;
    }
  }

  async getNote(guid: string): Promise<NoteEntity> {
    this.mes_(true, "note", { guid });
    try {
      const note = await this.client
        .getNoteStore()
        .getNote(guid, true, false, false, false);
      return new NoteEntity(note);
    } catch (err) {
      this.mes_(false, "note", { guid }, err);
      throw err;
    }
  }

  private mes_(
    start: boolean,
    name: string,
    dispData: Object = {},
    err: any = null
  ) {
    logger.debug(
      `Load remote ${name} was ${
        start ? "started" : err ? "failed" : "succeed"
      }. ${JSON.stringify(dispData)}`
    );
  }
}
