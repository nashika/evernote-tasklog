import {BaseEvernoteEntity} from "./base-evernote.entity";
import {IBaseEntityParams} from "./base.entity";

export class LinkedNotebookEntity extends BaseEvernoteEntity {

  static params:IBaseEntityParams = {
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
