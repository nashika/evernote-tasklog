import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";

export class TagEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Tag> {
}
