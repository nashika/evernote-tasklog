import MultiTable from './multi-table';

export default class NotebookTable extends MultiTable {

    static PLURAL_NAME:string = 'notebooks';
    static DEFAULT_SORT:Object = {stack: 1, name: 1};

}
