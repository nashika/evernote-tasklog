import evernote = require("evernote");

import core from "../core";
import {BaseSingleTable} from "./base-single-table";
import {SyncStateEntity} from "../../common/entity/sync-state-entity";

export class SyncStateTable extends BaseSingleTable<SyncStateEntity> {

  static PLURAL_NAME: string = 'syncStates';
  static DEFAULT_DOC: Object = {updateCount: 0};

  loadRemote(): Promise<SyncStateEntity> {
    var noteStore: evernote.Evernote.NoteStoreClient = core.users[this._username].client.getNoteStore();
    return new Promise((resolve, reject) => {
      noteStore.getSyncState((err: any, results?: SyncStateEntity) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

}
