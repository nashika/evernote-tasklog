import {LinkedNotebookEntity} from "../../common/entity/linked-notebook-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

export class LinkedNotebookTable extends BaseMultiEvernoteTable<LinkedNotebookEntity, IMultiEntityFindOptions> {

  static EntityClass = LinkedNotebookEntity;
  static PLURAL_NAME: string = 'linkedNotebooks';

}
