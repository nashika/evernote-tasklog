import * as evernote from "evernote";

import {MultiEntity} from "./multi-entity";

export class NoteEntity extends evernote.Evernote.Note implements MultiEntity {
    hasContent:boolean;
}
