import core from '../core';
import SingleModel from './single-model';

export default class SyncStateModel extends SingleModel {

    static PLURAL_NAME:string = 'syncStates';
    static DEFAULT_DOC:Object = {updateCount: 0};

    loadRemote(callback:(err?:Error, results?:any) => void):void {
        var noteStore = core.users[this._username].client.getNoteStore();
        noteStore.getSyncState(callback);
    }

}
