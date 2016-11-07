import {injectable} from "inversify";
import evernote = require("evernote");
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server.service";
import {UserEntity} from "../../common/entity/user.entity";
import {NoteEntity} from "../../common/entity/note.entity";
import {SyncStateEntity} from "../../common/entity/sync-state.entity";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

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
    this.mes_(true, "user", {userId: globalUser._id});
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        this.mes_(false, "user", {userId: globalUser._id}, err);
        if (err) return reject(err);
        resolve(new UserEntity(user));
      });
    });
  }

  getSyncState(globalUser: GlobalUserEntity): Promise<SyncStateEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[globalUser._id].getNoteStore();
    this.mes_(true, "syncState", {});
    return new Promise((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        this.mes_(false, "syncState", {updateCount: syncState && syncState.updateCount}, err);
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
    this.mes_(true, "syncChunk", {startUSN: updateCount});
    return new Promise((resolve, reject) => {
      noteStore.getFilteredSyncChunk(updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, (err, syncChunk) => {
        this.mes_(false, "syncChunk", {startUSN: updateCount}, err);
        if (err) return reject(err);
        resolve(<any>syncChunk);
      });
    });
  }

  getNote(globalUser: GlobalUserEntity, guid: string): Promise<NoteEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.clients[globalUser._id].getNoteStore();
    this.mes_(true, "note", {guid: guid});
    return Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        noteStore.getNote(guid, true, false, false, false, (err, note) => {
          this.mes_(false, "note", {guid: guid, title: note && note.title}, err);
          if (err) return reject(err);
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

  private mes_(start: boolean, name: string, dispData: Object, err: any = null) {
    logger.debug(`Load remote ${name} was ${start ? "started" : err ? "failed" : "succeed"}. ${JSON.stringify(dispData)}`);
  }

}
