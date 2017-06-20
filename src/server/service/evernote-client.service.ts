import {injectable} from "inversify";
import evernote = require("evernote");
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server.service";
import {NoteEntity} from "../../common/entity/note.entity";
import {configLoader} from "../../common/util/config-loader";

let logger = getLogger("system");

@injectable()
export class EvernoteClientService extends BaseServerService {

  SYNC_CHUNK_COUNT = 100;

  private client: evernote.Evernote.Client;

  async initialize(): Promise<void> {
    this.client = new evernote.Evernote.Client({
      token: configLoader.app.token,
      sandbox: configLoader.app.sandbox,
    });
  }

  async getUser(): Promise<evernote.Evernote.User> {
    let userStore: evernote.Evernote.UserStoreClient = this.client.getUserStore();
    this.mes_(true, "user", {});
    return await new Promise<evernote.Evernote.User>((resolve, reject) => {
      userStore.getUser((err, user) => {
        this.mes_(false, "user", {}, err);
        if (err) return reject(err);
        resolve(user);
      });
    });
  }

  async getSyncState(): Promise<evernote.Evernote.SyncState> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.client.getNoteStore();
    this.mes_(true, "syncState", {});
    return await new Promise<evernote.Evernote.SyncState>((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        this.mes_(false, "syncState", {updateCount: syncState && syncState.updateCount}, err);
        if (err) return reject(err);
        resolve(syncState);
      });
    });
  }

  async getFilteredSyncChunk(updateCount: number): Promise<evernote.Evernote.SyncChunk> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.client.getNoteStore();
    let syncChunkFilter: evernote.Evernote.SyncChunkFilter = new evernote.Evernote.SyncChunkFilter();
    syncChunkFilter.includeNotes = true;
    syncChunkFilter.includeNotebooks = true;
    syncChunkFilter.includeTags = true;
    syncChunkFilter.includeSearches = true;
    syncChunkFilter.includeExpunged = true;
    this.mes_(true, "syncChunk", {startUSN: updateCount});
    return await new Promise<evernote.Evernote.SyncChunk>((resolve, reject) => {
      noteStore.getFilteredSyncChunk(updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, (err, syncChunk) => {
        this.mes_(false, "syncChunk", {startUSN: updateCount}, err);
        if (err) return reject(err);
        resolve(<any>syncChunk);
      });
    });
  }

  async getNote(guid: string): Promise<NoteEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.client.getNoteStore();
    this.mes_(true, "note", {guid: guid});
    return await new Promise<NoteEntity>((resolve, reject) => {
      noteStore.getNote(guid, true, false, false, false, (err, note) => {
        this.mes_(false, "note", {guid: guid, title: note && note.title}, err);
        if (err) return reject(err);
        resolve(new NoteEntity(note));
      });
    });
  }

  private mes_(start: boolean, name: string, dispData: Object = {}, err: any = null) {
    logger.debug(`Load remote ${name} was ${start ? "started" : err ? "failed" : "succeed"}. ${JSON.stringify(dispData)}`);
  }

}
