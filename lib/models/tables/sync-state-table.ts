import core from '../../core';
import SingleTable from './single-table';

export default class SyncStateTable extends SingleTable {

    static PLURAL_NAME:string = 'syncStates';
    static DEFAULT_DOC:Object = {updateCount: 0};

    loadRemote(callback:(err?:Error, results?:any) => void):void {
        var noteStore = core.users[this._username].client.getNoteStore();
        noteStore.getSyncState(callback);
    }

}
