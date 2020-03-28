import { BaseEvernoteEntity } from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export class LinkedNotebookEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<LinkedNotebookEntity> = {
    name: "linkedNotebook",
    primaryKey: "guid",
    displayField: "shareName",
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

  shareName: string | null = null;
  username: string | null = null;
  shareId: string | null = null;
  sharedNotebookGlobalId: string | null = null;
  uri: string | null = null;
  noteStoreUrl: string | null = null;
  webApiUrlPrefix: string | null = null;
  stack: string | null = null;
  businessId: number | null = null;
}
