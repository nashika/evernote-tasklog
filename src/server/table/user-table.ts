import evernote = require("evernote");

import core from "../core";
import {BaseSingleTable} from "./base-single-table";
import {UserEntity} from "../../common/entity/user-entity";

export class UserTable extends BaseSingleTable<UserEntity> {

  static PLURAL_NAME: string = "users";
  static DEFAULT_DOC: Object = new UserEntity();

  loadRemote(): Promise<UserEntity> {
    let userStore: evernote.Evernote.UserStoreClient = core.users[this._username].client.getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err: any, results?: UserEntity) => {
        if (err) return reject(err);
        return resolve(results);
      });
    });
  }

}
