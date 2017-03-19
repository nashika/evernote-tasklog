import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class SavedSearchEntity extends BaseMultiEvernoteEntity {

  static params: IBaseMultiEntityParams = {
    name: "savedSearch",
    primaryKey: "guid",
    displayField: "name",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [["updated", "DESC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string;
  query: string;

}
