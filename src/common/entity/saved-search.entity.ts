import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class SavedSearchEntity extends BaseMultiEvernoteEntity {

  static params: IBaseMultiEntityParams = {
    name: "savedSearch",
    titleField: "name",
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

  guid: string;
  name: string;
  query: string;
  updateSequenceNum: number;

}
