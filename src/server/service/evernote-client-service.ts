import {injectable} from "inversify";
import evernote = require("evernote");
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server-service";
import {UserEntity} from "../../common/entity/user-entity";
import {NoteEntity} from "../../common/entity/note-entity";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";

let logger = getLogger("system");

@injectable()
export class EvernoteClientService extends BaseServerService {

  SYNC_CHUNK_COUNT = 100;

  private clients: {[username: string]: evernote.Evernote.Client};

  constructor() {
    super();
    this.clients = {};
  }

  initializeUser(username: string, token: string, sandbox: boolean): void {
    this.clients[username] = new evernote.Evernote.Client({
      token: token,
      sandbox: sandbox,
    });
  }

  getUser(username: string): Promise<UserEntity> {
    let userStore: evernote.Evernote.UserStoreClient = this.clients[username].getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        if (err) return reject(err);
        resolve(new UserEntity(user));
      });
    });
  }

  getSyncState(username: string): Promise<SyncStateEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[username].getNoteStore();
    return new Promise((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        if (err) return reject(err);
        resolve(new SyncStateEntity(syncState));
      });
    });
  }

  getFilteredSyncChunk(username: string, updateCount: number): Promise<evernote.Evernote.SyncChunk> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[username].getNoteStore();
    let syncChunkFilter: evernote.Evernote.SyncChunkFilter = new evernote.Evernote.SyncChunkFilter();
    syncChunkFilter.includeNotes = true;
    syncChunkFilter.includeNotebooks = true;
    syncChunkFilter.includeTags = true;
    syncChunkFilter.includeSearches = true;
    syncChunkFilter.includeExpunged = true;
    logger.info(`Get sync chunk start. startUSN=${updateCount}`);
    return new Promise((resolve, reject) => {
      noteStore.getFilteredSyncChunk(updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, (err, syncChunk) => {
        if (err) return reject(err);
        resolve(<any>syncChunk);
      });
    });
  }

  getNote(username: string, guid: string): Promise<NoteEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[username].getNoteStore();
    logger.debug(`Loading note from remote was started. guid=${guid}`);
    return Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        noteStore.getNote(guid, true, false, false, false, (err, note) => {
          if (err) return reject(err);
          logger.debug(`Loading note was succeed. guid=${note.guid} title=${note.title}`);
          resolve(new NoteEntity(note));
        });
      });
    })
  }

  getUserFromToken(token: string, sandbox: boolean): Promise<UserEntity> {
    let client = new evernote.Evernote.Client({
      token: token,
      sandbox: sandbox,
    });
    let userStore: evernote.Evernote.UserStoreClient = client.getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        if (err) return reject(err);
        resolve(new UserEntity(user));
      });
    });
  }

}
