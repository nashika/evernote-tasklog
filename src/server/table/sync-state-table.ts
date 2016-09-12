import evernote = require("evernote");

import core from "../core";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote-table";

export class SyncStateTable extends BaseSingleEvernoteTable<SyncStateEntity> {

  static PLURAL_NAME: string = 'syncStates';
  static DEFAULT_DOC: Object = {updateCount: 0};

  loadRemote(): Promise<SyncStateEntity> {
    var noteStore: evernote.Evernote.NoteStoreClient = core.users[this.username].client.getNoteStore();
    return new Promise((resolve, reject) => {
      noteStore.getSyncState((err, syncState) => {
        if (err) return reject(err);
        resolve(new SyncStateEntity(syncState));
      });
    });
  }

}
