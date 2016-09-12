import evernote = require("evernote");

import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";

export class SyncStateEntity extends BaseSingleEvernoteEntity<evernote.Evernote.SyncState> {

  updateCount: number;

}
