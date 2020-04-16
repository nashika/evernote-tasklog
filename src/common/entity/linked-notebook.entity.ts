import BaseEvernoteEntity from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export default class LinkedNotebookEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<LinkedNotebookEntity> = {
    name: "linkedNotebook",
    primaryKey: "guid",
    displayField: "shareName",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 500,
    },
    append: {},
  };

  shareName?: string;
  username?: string;
  shareId?: string;
  sharedNotebookGlobalId?: string;
  uri?: string;
  noteStoreUrl?: string;
  webApiUrlPrefix?: string;
  stack?: string;
  businessId?: number;
}