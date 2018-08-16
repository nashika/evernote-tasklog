import {injectable} from "inversify";
import Evernote = require("evernote");
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server.service";
import {NoteEntity} from "../../common/entity/note.entity";
import {configLoader} from "../../common/util/config-loader";

let logger = getLogger("system");

@injectable()
export class EvernoteClientService extends BaseServerService {

  SYNC_CHUNK_COUNT = 100;

  private client: Evernote.Client;

  async initialize(): Promise<void> {
    this.client = new Evernote.Client({
      token: configLoader.app.token,
      sandbox: configLoader.app.sandbox,
    });
  }

  async getUser(): Promise<Evernote.User> {
    this.mes_(true, "user", {});
    try {
      return await this.client.getUserStore().getUser();
    } catch (err) {
      this.mes_(false, "user", {}, err);
      throw err;
    }
  }

  async getSyncState(): Promise<Evernote.SyncState> {
    this.mes_(true, "syncState", {});
    try {
      return await this.client.getNoteStore().getSyncState();
    } catch (err) {
      this.mes_(false, "syncState", err);
      throw err;
    }
  }

  async getFilteredSyncChunk(updateCount: number): Promise<Evernote.SyncChunk> {
    let syncChunkFilter: Evernote.SyncChunkFilter = new Evernote.NoteStore.SyncChunkFilter();
    syncChunkFilter.includeNotes = true;
    syncChunkFilter.includeNotebooks = true;
    syncChunkFilter.includeTags = true;
    syncChunkFilter.includeSearches = true;
    syncChunkFilter.includeExpunged = true;
    this.mes_(true, "syncChunk", {startUSN: updateCount});
    try {
      return await this.client.getNoteStore().getFilteredSyncChunk(updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter);
    } catch (err) {
      this.mes_(false, "syncChunk", {startUSN: updateCount}, err);
      throw err;
    }
  }

  async getNote(guid: string): Promise<NoteEntity> {
    this.mes_(true, "note", {guid: guid});
    try {
      let note = await this.client.getNoteStore().getNote(guid, true, false, false, false);
      return new NoteEntity(note);
    } catch (err) {
      this.mes_(false, "note", {guid: guid}, err);
      throw err;
    }
  }

  private mes_(start: boolean, name: string, dispData: Object = {}, err: any = null) {
    logger.debug(`Load remote ${name} was ${start ? "started" : err ? "failed" : "succeed"}. ${JSON.stringify(dispData)}`);
  }

}
