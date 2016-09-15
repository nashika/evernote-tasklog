import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IBaseSingleEntityParams} from "./base-single-entity";

export class SyncStateEntity extends BaseSingleEvernoteEntity<evernote.Evernote.SyncState> {

  static params:IBaseSingleEntityParams = {
    name: "syncState",
    titleField: "name",
    requireUser: true,
    defaultDoc: {updateCount: 0},
  };

  updateCount: number;

}
