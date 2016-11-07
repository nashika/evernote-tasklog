import {BaseMultiEvernoteEntity} from "./base-multi-evernote.entity";
import {IBaseMultiEntityParams, IMultiEntityFindOptions} from "./base-multi.entity";

export interface INoteEntityFindOptions extends IMultiEntityFindOptions {
  content?: boolean;
}

export class NoteEntity extends BaseMultiEvernoteEntity {

  static params:IBaseMultiEntityParams = {
    name: "note",
    titleField: "title",
    requireUser: true,
    archive: true,
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
