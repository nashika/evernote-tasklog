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
        nullable: false,
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
        nullable: true,
      },
      serviceUpdated: {
        type: "integer",
        nullable: true,
      },
      publishing: {
        type: "text",
        nullable: true,
      },
      published: {
        type: "boolean",
        nullable: true,
      },
      stack: {
        type: "string",
        nullable: true,
      },
      sharedNotebookIds: {
        type: "text",
        nullable: true,
      },
      sharedNotebooks: {
        type: "text",
        nullable: true,
      },
      businessNotebooks: {
        type: "text",
        nullable: true,
      },
      contact: {
        type: "text",
        nullable: true,
      },
      restrictions: {
        type: "text",
        nullable: true,
      },
      recipientSettings: {
        type: "text",
        nullable: true,
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

  name!: string;
  defaultNotebook!: boolean;
  serviceCreated!: number | null;
  serviceUpdated!: number | null;
  publishing!: Object | null;
  published!: boolean | null;
  stack!: string | null;
  sharedNotebookIds!: number[] | null;
  sharedNotebooks!: Object[] | null;
  businessNotebooks!: Object | null;
  contact!: Object | null;
  restrictions!: Object | null;
  recipientSettings!: Object | null;
}
