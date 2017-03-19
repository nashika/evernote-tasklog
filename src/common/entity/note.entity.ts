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
  content: string;
  contentHash: Object;
  contentLength: number;
  created: number;
  updated: number;
  deleted: number;
  active: boolean;
  notebookGuid: string;
  tagGuids: string[];
  resources: Object[];
  attributes: Object;
  tagNames: string[];
  sharedNotes: Object[];
  restrictions: any;
  limits: any;

  hasContent: boolean;

}
