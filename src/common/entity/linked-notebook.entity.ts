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
        nullable: false,
      },
      shareName: {
        type: "string",
        nullable: true,
      },
      username: {
        type: "string",
        nullable: true,
      },
      shareId: {
        type: "string",
        nullable: true,
      },
      sharedNotebookGlobalId: {
        type: "string",
        nullable: true,
      },
      uri: {
        type: "string",
        nullable: true,
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
      noteStoreUrl: {
        type: "string",
        nullable: true,
      },
      webApiUrlPrefix: {
        type: "string",
        nullable: true,
      },
      stack: {
        type: "string",
        nullable: true,
      },
      businessId: {
        type: "integer",
        nullable: true,
      },
    },
  };

  shareName!: string;
  username!: string | null;
  shareId!: string | null;
  sharedNotebookGlobalId!: string | null;
  uri!: string | null;
  noteStoreUrl!: string | null;
  webApiUrlPrefix!: string | null;
  stack!: string | null;
  businessId!: number | null;
}
