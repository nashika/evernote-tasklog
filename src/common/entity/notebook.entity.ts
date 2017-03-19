import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class NotebookEntity extends BaseMultiEvernoteEntity {

  static params:IBaseMultiEntityParams = {
    name: "notebook",
    primaryKey: "guid",
    displayField: "name",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [["stack", "ASC"], ["name", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string;
  stack: string;

}
