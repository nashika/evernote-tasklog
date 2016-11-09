import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class TagEntity extends BaseMultiEvernoteEntity {

  static params:IBaseMultiEntityParams = {
    name: "tag",
    titleField: "name",
    requireUser: true,
    archive: false,
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

  name: string;
  parentGuid: string;

}
