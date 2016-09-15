import {injectable} from "inversify";

import {LinkedNotebookEntity} from "../../common/entity/linked-notebook-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

@injectable()
export class LinkedNotebookTable extends BaseMultiEvernoteTable<LinkedNotebookEntity, IMultiEntityFindOptions> {
}
