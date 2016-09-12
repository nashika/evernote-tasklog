import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IEntityParams} from "./base-entity";

export class NoteEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Note> {

  static params:IEntityParams = {
    name: "note",
  };

  title: string;
  updated: number;
  content: string;

  hasContent: boolean;

}
