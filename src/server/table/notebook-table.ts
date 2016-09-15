import {injectable} from "inversify";

import {NotebookEntity} from "../../common/entity/notebook-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

@injectable()
export class NotebookTable extends BaseMultiEvernoteTable<NotebookEntity, IMultiEntityFindOptions> {
}
