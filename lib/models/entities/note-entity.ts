import * as evernote from "evernote";

import MultiEntity from "./multi-entity";

export default class NoteEntity extends evernote.Evernote.Note implements MultiEntity {
    hasContent:boolean;
}
