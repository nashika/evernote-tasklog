import BaseEvernoteEntity from "./base-evernote.entity";
import { IEntityParams } from "./base.entity";

export default class LinkedNotebookEntity extends BaseEvernoteEntity {
  static readonly params: IEntityParams<LinkedNotebookEntity> = {
    name: "linkedNotebook",
    primaryKey: "guid",
    displayField: "shareName",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 500,
    },
    append: {},
    columns: {
      guid: {
        type: "string",
        primary: true,
        generated: true,
      },
      shareName: {
        type: "string",
      },
      username: {
        type: "string",
      },
      shareId: {
        type: "string",
      },
      sharedNotebookGlobalId: {
        type: "string",
      },
      uri: {
        type: "string",
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
      noteStoreUrl: {
        type: "string",
      },
      webApiUrlPrefix: {
        type: "string",
      },
      stack: {
        type: "string",
      },
      businessId: {
        type: "integer",
      },
    },
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
