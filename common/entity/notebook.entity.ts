import { BaseEvernoteEntity } from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export class NotebookEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<NotebookEntity> = {
    name: "notebook",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      where: {},
      order: [
        ["stack", "ASC"],
        ["name", "ASC"],
      ],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string | null = null;
  defaultNotebook: boolean | null = null;
  serviceCreated: number | null = null;
  serviceUpdated: number | null = null;
  publishing: Object | null = null;
  published: boolean | null = null;
  stack: string | null = null;
  sharedNotebookIds: number[] | null = null;
  sharedNotebooks: Object[] | null = null;
  businessNotebooks: Object | null = null;
  contact: Object | null = null;
  restrictions: Object | null = null;
  recipientSettings: Object | null = null;
}
