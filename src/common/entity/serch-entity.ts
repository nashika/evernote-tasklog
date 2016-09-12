import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";

export class SearchEntity extends BaseMultiEvernoteEntity<evernote.Evernote.SavedSearch> {
}
