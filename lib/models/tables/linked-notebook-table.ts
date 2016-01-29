import {MultiTable, MultiTableOptions} from './multi-table';
import LinkedNotebookEntity from "../entities/linked-notebook-entity";

export default class LinkedNotebookTable extends MultiTable<LinkedNotebookEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'linkedNotebooks';

}
