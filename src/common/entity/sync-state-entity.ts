import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IEntityParams} from "./base-entity";

export class SyncStateEntity extends BaseSingleEvernoteEntity<evernote.Evernote.SyncState> {

  static params:IEntityParams = {
    name: "syncState",
  };

  updateCount: number;

}
