import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";

export class NoteEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Note> {

  title: string;
  updated: number;
  content: string;

  hasContent: boolean;

}
