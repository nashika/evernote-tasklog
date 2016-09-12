import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IEntityParams} from "./base-entity";

export class SearchEntity extends BaseMultiEvernoteEntity<evernote.Evernote.SavedSearch> {

  static params:IEntityParams = {
    name: "search",
  };

}
