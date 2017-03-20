import {BaseEvernoteEntity} from "./base-evernote.entity";
import {IBaseEntityParams} from "./base.entity";

export class TagEntity extends BaseEvernoteEntity {

  static params:IBaseEntityParams = {
    name: "tag",
    primaryKey: "guid",
    displayField: "name",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [["name", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string;
  parentGuid: string;

}
