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
