import evernote = require("evernote");

import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IEntityParams} from "./base-entity";

export class TagEntity extends BaseMultiEvernoteEntity<evernote.Evernote.Tag> {

  static params:IEntityParams = {
    name: "tag",
  };

}
