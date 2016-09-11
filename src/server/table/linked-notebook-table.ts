import {BaseMultiTable} from "./base-multi-table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook-entity";
import {MultiTableOptions} from "./base-multi-table";

export class LinkedNotebookTable extends BaseMultiTable<LinkedNotebookEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'linkedNotebooks';

}
