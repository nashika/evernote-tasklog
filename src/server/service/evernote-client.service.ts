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
    this.loadMessage(true, "user", {});
    return await new Promise<evernote.Evernote.User>((resolve, reject) => {
      userStore.getUser((err, user) => {
        this.loadMessage(false, "user", {}, err);
        if (err) return reject(err);
        resolve(user);
      });
    });
  }

  async getSyncState(): Promise<evernote.Evernote.SyncState> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.client.getNoteStore();
    this.loadMessage(true, "syncState", {});
    return await new Promise<evernote.Evernote.SyncState>((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        this.loadMessage(false, "syncState", {updateCount: syncState && syncState.updateCount}, err);
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
    this.loadMessage(true, "syncChunk", {startUSN: updateCount});
    return await new Promise<evernote.Evernote.SyncChunk>((resolve, reject) => {
      noteStore.getFilteredSyncChunk(updateCount, this.SYNC_CHUNK_COUNT, syncChunkFilter, (err, syncChunk) => {
        this.loadMessage(false, "syncChunk", {startUSN: updateCount}, err);
        if (err) return reject(err);
        resolve(<any>syncChunk);
      });
    });
  }

  async getNote(guid: string): Promise<NoteEntity> {
    let noteStore: evernote.Evernote.NoteStoreClient = this.client.getNoteStore();
    this.loadMessage(true, "note", {guid: guid});
    return await new Promise<NoteEntity>((resolve, reject) => {
      noteStore.getNote(guid, true, false, false, false, (err, note) => {
        this.loadMessage(false, "note", {guid: guid, title: note && note.title}, err);
        if (err) return reject(err);
        resolve(new NoteEntity(note));
      });
    });
  }

  async createNote(note: NoteEntity): Promise<NoteEntity> {
    let noteStore = this.client.getNoteStore();
    this.message("Create remote note", true, {noteTitle: note.title});
    return await new Promise<NoteEntity>((resolve, reject) => {
      noteStore.createNote(this.noteEntityToEvernoteNote(note), (err, createdNote) => {
        this.message("Create remote note", false, {noteTitle: note.title}, err);
        if (err) return reject(err);
        resolve(new NoteEntity(createdNote));
      });
    });
  }

  async updateNote(note: NoteEntity): Promise<NoteEntity> {
    let noteStore = this.client.getNoteStore();
    this.message("Update remote note", true, {noteTitle: note.title});
    return await new Promise<NoteEntity>((resolve, reject) => {
      noteStore.updateNote(this.noteEntityToEvernoteNote(note), (err, updatedNote) => {
        this.message("Update remote note", false, {noteTitle: note.title}, err);
        if (err) return reject(err);
        resolve(new NoteEntity(updatedNote));
      });
    });
  }

  private noteEntityToEvernoteNote(note: NoteEntity): evernote.Evernote.Note {
    return new evernote.Evernote.Note({
      guid: note.guid,
      title: note.title,
      content: note.content,
      created: note.created,
      updated: note.updated,
      deleted: note.deleted,
      active: note.active,
      notebookGuid: note.notebookGuid,
      tagGuids: note.tagGuids,
      attributes: new evernote.Evernote.NoteAttributes({
        subjectDate: note.attributes.subjectDate,
        latitude: note.attributes.latitude,
        longitude: note.attributes.longitude,
        author: note.attributes.author,
        source: note.attributes.source,
        sourceURL: note.attributes.sourceURL,
        sourceApplication: note.attributes.sourceApplication,
        shareDate: note.attributes.shareDate,
        reminderOrder: note.attributes.reminderOrder,
        reminderDoneTime: note.attributes.reminderDoneTime,
        reminderTime: note.attributes.reminderTime,
        placeName: note.attributes.placeName,
        contentClass: note.attributes.contentClass,
      }),
    });
  }

  private loadMessage(isStart: boolean, name: string, dispData: Object = {}, err: any = null) {
    this.message(`Load remote ${name}`, isStart, dispData, err);
  }

  private message(action: string, isStart: boolean, dispData: Object = {}, err: any = null) {
    logger.debug(`${action} was ${isStart ? "started" : err ? "failed" : "succeed"}. ${JSON.stringify(dispData)}`);
  }

}
