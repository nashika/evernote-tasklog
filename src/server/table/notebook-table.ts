import {BaseMultiTable} from "./base-multi-table";
import {MultiTableOptions} from "./base-multi-table";
import {NotebookEntity} from "../../common/entity/notebook-entity";

export class NotebookTable extends BaseMultiTable<NotebookEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'notebooks';
    static DEFAULT_SORT:Object = {stack: 1, name: 1};

}
