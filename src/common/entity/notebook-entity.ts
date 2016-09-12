import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";

export class NotebookEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Notebook> {

  name: string;
  stack: string;

}
