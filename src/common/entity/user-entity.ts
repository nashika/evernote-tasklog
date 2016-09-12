import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";

export class UserEntity extends BaseSingleEvernoteEntity<evernote.Evernote.User> {

  id: number;
  username: string;
  shardId: string;

}
