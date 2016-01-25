import core from '../core';
import SingleModel from './single-model';

export default class UserModel extends SingleModel {

    static PLURAL_NAME:string = 'users';
    static DEFAULT_DOC:Object = {};

    loadRemote(callback:(err?:Error, results?:any) => void):void {
        var userStore = core.users[this._username].client.getUserStore();
        userStore.getUser(callback);
    }

}
