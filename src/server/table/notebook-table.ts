import {NotebookEntity} from "../../common/entity/notebook-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

export class NotebookTable extends BaseMultiEvernoteTable<NotebookEntity, IMultiEntityFindOptions> {

  static EntityClass = NotebookEntity;
  static PLURAL_NAME: string = 'notebooks';
  static DEFAULT_SORT: Object = {stack: 1, name: 1};

}
