import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IBaseMultiEntityParams} from "./base-multi-entity";

export class SearchEntity extends BaseMultiEvernoteEntity<evernote.Evernote.SavedSearch> {

  static params: IBaseMultiEntityParams = {
    name: "search",
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
