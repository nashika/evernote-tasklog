import * as evernote from "evernote";

import core from "../core";
import {BaseSingleTable} from "./base-single-table";
import {UserEntity} from "../../common/entity/user-entity";

export class UserTable extends BaseSingleTable<UserEntity> {

    static PLURAL_NAME:string = 'users';
    static DEFAULT_DOC:Object = new UserEntity();

    loadRemote(callback:(err?:Error, results?:UserEntity) => void):void {
        var userStore:evernote.Evernote.UserStoreClient = core.users[this._username].client.getUserStore();
        userStore.getUser(callback);
    }

}
