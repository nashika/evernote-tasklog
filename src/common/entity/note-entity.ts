import {BaseMultiEvernoteEntity} from "./base-multi-evernote-entity";
import {IBaseMultiEntityParams} from "./base-multi-entity";

export class NoteEntity extends BaseMultiEvernoteEntity {

  static params:IBaseMultiEntityParams = {
    name: "note",
    titleField: "title",
    requireUser: true,
    default: {
      query: {},
      sort: {updated: -1},
      limit: 500,
    },
    append: {
      query: {deleted: null},
      sort: {},
    },
  };

  title: string;
  updated: number;
  content: string;

  hasContent: boolean;

}
