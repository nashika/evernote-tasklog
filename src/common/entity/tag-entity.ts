import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IBaseMultiEntityParams} from "./base-multi-entity";

export class TagEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Tag> {

  static params:IBaseMultiEntityParams = {
    name: "tag",
    titleField: "name",
    requireUser: true,
    default: {
      query: {},
      sort: {updated: -1},
      limit: 500,
    },
    append: {
      query: {},
      sort: {},
    },
  };

}
