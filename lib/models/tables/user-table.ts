import core from '../../core';
import SingleTable from './single-table';

export default class UserTable extends SingleTable {

    static PLURAL_NAME:string = 'users';
    static DEFAULT_DOC:Object = {};

    loadRemote(callback:(err?:Error, results?:any) => void):void {
        var userStore = core.users[this._username].client.getUserStore();
        userStore.getUser(callback);
    }

}
