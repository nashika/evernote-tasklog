import * as evernote from "evernote";

import core from '../../core';
import SingleTable from './single-table';
import UserEntity from "../entities/user-entity";

export default class UserTable extends SingleTable {

    static PLURAL_NAME:string = 'users';
    static DEFAULT_DOC:Object = new UserEntity();

    loadRemote(callback:(err?:Error, results?:UserEntity) => void):void {
        var userStore:evernote.Evernote.UserStoreClient = core.users[this._username].client.getUserStore();
        userStore.getUser(callback);
    }

}
