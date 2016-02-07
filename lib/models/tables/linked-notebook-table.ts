
import {MultiTable} from "./multi-table";
import {LinkedNotebookEntity} from "../entities/linked-notebook-entity";
import {MultiTableOptions} from "./multi-table";
export class LinkedNotebookTable extends MultiTable<LinkedNotebookEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'linkedNotebooks';

}
