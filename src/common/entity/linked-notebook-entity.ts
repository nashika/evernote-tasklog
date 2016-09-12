import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IEntityParams} from "./base-entity";

export class LinkedNotebookEntity extends BaseMultiEvernoteEntity<evernote.Evernote.LinkedNotebook> {

  static params:IEntityParams = {
    name: "linkedNotebook",
  };

}
