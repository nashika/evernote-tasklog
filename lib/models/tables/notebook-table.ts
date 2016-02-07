import {MultiTable} from "./multi-table";
import {MultiTableOptions} from "./multi-table";
import {NotebookEntity} from "../entities/notebook-entity";

export class NotebookTable extends MultiTable<NotebookEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'notebooks';
    static DEFAULT_SORT:Object = {stack: 1, name: 1};

}
