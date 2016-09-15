import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IBaseEntityParams} from "./base-entity";
import {IBaseSingleEntityParams} from "./base-single-entity";

export class UserEntity extends BaseSingleEvernoteEntity<evernote.Evernote.User> {

  static params:IBaseSingleEntityParams = {
    name: "user",
    titleField: "name",
    requireUser: true,
    defaultDoc: {},
  };

  id: number;
  username: string;
  shardId: string;

}
