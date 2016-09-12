import evernote = require("evernote");

import core from "../core";
import {UserEntity} from "../../common/entity/user-entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote-table";

export class UserTable extends BaseSingleEvernoteTable<UserEntity> {

  static EntityClass = UserEntity;
  static PLURAL_NAME = "users";
  static DEFAULT_DOC = {};

  loadRemote(): Promise<UserEntity> {
    let userStore: evernote.Evernote.UserStoreClient = core.users[this.username].client.getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        if (err) return reject(err);
        return resolve(new UserEntity(user));
      });
    });
  }

  static loadRemoteFromToken(token: string, sandbox: boolean): Promise<UserEntity> {
    let client = new evernote.Evernote.Client({
      token: token,
      sandbox: sandbox,
    });
    let userStore: evernote.Evernote.UserStoreClient = client.getUserStore();
    return new Promise((resolve, reject) => {
      userStore.getUser((err, user) => {
        if (err) return reject(err);
        resolve(new UserEntity(user));
      });
    });
  }

}
