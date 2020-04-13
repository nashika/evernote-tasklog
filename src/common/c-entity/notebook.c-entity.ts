import BaseEvernoteCEntity from "./base-evernote.c-entity";
import { IBaseCEntityParams } from "./base.c-entity";

export default class NotebookCEntity extends BaseEvernoteCEntity {
  static params: IBaseCEntityParams<NotebookCEntity> = {
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
