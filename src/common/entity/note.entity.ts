import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams} from "./base-multi.entity";

export class NoteEntity extends BaseMultiEvernoteEntity {

  static params: IBaseMultiEntityParams = {
    name: "note",
    primaryKey: "guid",
    displayField: "title",
    requireUser: true,
    archive: true,
    default: {
      where: {},
      order: [["updated", "DESC"], ["updateSequenceNum", "DESC"]],
      limit: 500,
    },
    append: {
      where: {deleted: null},
    },
  };

  title: string;
  notebookGuid: string;
  tagGuids: string[];
  created: number;
  updated: number;
  content: string;

  hasContent: boolean;

}
