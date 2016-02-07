import * as evernote from "evernote";

import core from '../../core';
import {SingleTable} from "./single-table";
import {SyncStateEntity} from "../entities/sync-state-entity";

export class SyncStateTable extends SingleTable<SyncStateEntity> {

    static PLURAL_NAME:string = 'syncStates';
    static DEFAULT_DOC:Object = {updateCount: 0};

    loadRemote(callback:(err?:Error, results?:SyncStateEntity) => void):void {
        var noteStore:evernote.Evernote.NoteStoreClient = core.users[this._username].client.getNoteStore();
        noteStore.getSyncState(callback);
    }

}
