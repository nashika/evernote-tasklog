import BaseEvernoteEntity from "./base-evernote.entity";
import { IEntityParams } from "./base.entity";

export default class NotebookEntity extends BaseEvernoteEntity {
  static readonly params: IEntityParams<NotebookEntity> = {
    name: "notebook",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      order: { stack: "ASC", name: "ASC" },
      take: 500,
    },
    append: {},
    columns: {
      guid: {
        type: "string",
        primary: true,
      },
      name: {
        type: "string",
        nullable: false,
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
      defaultNotebook: {
        type: "boolean",
        nullable: false,
      },
      serviceCreated: {
        type: "integer",
      },
      serviceUpdated: {
        type: "integer",
      },
      publishing: {
        type: "text",
      },
      published: {
        type: "boolean",
      },
      stack: {
        type: "string",
      },
      sharedNotebookIds: {
        type: "text",
      },
      sharedNotebooks: {
        type: "text",
      },
      businessNotebooks: {
        type: "text",
      },
      contact: {
        type: "text",
      },
      restrictions: {
        type: "text",
      },
      recipientSettings: {
        type: "text",
      },
    },
    jsonFields: [
      "publishing",
      "sharedNotebookIds",
      "sharedNotebooks",
      "businessNotebooks",
      "contact",
      "restrictions",
      "recipientSettings",
    ],
  };

  name?: string;
  defaultNotebook?: boolean;
  serviceCreated?: number;
  serviceUpdated?: number;
  publishing?: Object;
  published?: boolean;
  stack?: string;
  sharedNotebookIds?: number[];
  sharedNotebooks?: Object[];
  businessNotebooks?: Object;
  contact?: Object;
  restrictions?: Object;
  recipientSettings?: Object;
}
