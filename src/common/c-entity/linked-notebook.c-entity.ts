import BaseEvernoteCEntity from "./base-evernote.c-entity";
import { IBaseCEntityParams } from "./base.c-entity";

export default class LinkedNotebookCEntity extends BaseEvernoteCEntity {
  static params: IBaseCEntityParams<LinkedNotebookCEntity> = {
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
