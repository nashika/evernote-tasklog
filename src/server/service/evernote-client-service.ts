import {injectable} from "inversify";
import evernote = require("evernote");
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server-service";
import {UserEntity} from "../../common/entity/user-entity";
import {NoteEntity} from "../../common/entity/note-entity";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

let logger = getLogger("system");

@injectable()
export class EvernoteClientService extends BaseServerService {

  SYNC_CHUNK_COUNT = 100;

  private clients: {[username: string]: evernote.Evernote.Client};

  constructor() {
    super();
    this.clients = {};
  }

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    this.clients[globalUser._id] = new evernote.Evernote.Client({
      token: globalUser.token,
      sandbox: globalUser.sandbox,
    });
    return Promise.resolve();
  }

  getUser(globalUser: GlobalUserEntity): Promise<UserEntity> {
    let userStore: evernote.Evernote.UserStoreClient = this.clients[globalUser._id].getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        if (err) return reject(err);
        resolve(new UserEntity(user));
      });
    });
  }

  getSyncState(globalUser: GlobalUserEntity): Promise<SyncStateEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[globalUser._id].getNoteStore();
    return new Promise((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        if (err) return reject(err);
        resolve(new SyncStateEntity(syncState));
      });
    });
  }

  getFilteredSyncChunk(globalUser: GlobalUserEntity, updateCount: number): Promise<evernote.Evernote.SyncChunk> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[globalUser._id].getNoteStore();
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

  getNote(globalUser: GlobalUserEntity, guid: string): Promise<NoteEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[globalUser._id].getNoteStore();
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
