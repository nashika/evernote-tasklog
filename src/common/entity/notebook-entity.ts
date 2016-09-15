import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IBaseMultiEntityParams} from "./base-multi-entity";

export class NotebookEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Notebook> {

  static params:IBaseMultiEntityParams = {
    name: "notebook",
    titleField: "name",
    requireUser: true,
    default: {
      query: {},
      sort: {stack: 1, name: 1},
      limit: 500,
    },
    append: {
      query: {},
      sort: {},
    },
  };

  name: string;
  stack: string;

}
