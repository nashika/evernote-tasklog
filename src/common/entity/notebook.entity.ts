import {BaseEvernoteEntity} from "./base-evernote.entity";
import {IBaseEntityParams} from "./base.entity";

export class NotebookEntity extends BaseEvernoteEntity {

  static params:IBaseEntityParams = {
    name: "notebook",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      where: {},
      order: [["stack", "ASC"], ["name", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string;
  defaultNotebook: boolean;
  serviceCreated: number;
  serviceUpdated: number;
  publishing: Object;
  published: boolean;
  stack: string;
  sharedNotebookIds: number[];
  sharedNotebooks: Object[];
  businessNotebooks: Object;
  contact: Object;
  restrictions: Object;
  recipientSettings: Object;

}
