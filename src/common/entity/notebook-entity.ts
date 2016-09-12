import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IEntityParams} from "./base-entity";

export class NotebookEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Notebook> {

  static params:IEntityParams = {
    name: "notebook",
  };

  name: string;
  stack: string;

}
