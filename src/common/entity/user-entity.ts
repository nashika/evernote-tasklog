import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IEntityParams} from "./base-entity";

export class UserEntity extends BaseSingleEvernoteEntity<evernote.Evernote.User> {

  static params:IEntityParams = {
    name: "user",
  };

  id: number;
  username: string;
  shardId: string;

}
