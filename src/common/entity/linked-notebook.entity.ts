import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class LinkedNotebookEntity extends BaseMultiEvernoteEntity {

  static params:IBaseMultiEntityParams = {
    name: "linkedNotebook",
    primaryKey: "guid",
    displayField: "shareName",
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

  shareName: string;
  username: string;
  shareId: string;
  sharedNotebookGlobalId: string;
  uri: string;
  noteStoreUrl: string;
  webApiUrlPrefix: string;
  stack: string;
  businessId: number;

}
