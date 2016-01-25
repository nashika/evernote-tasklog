import MultiModel from './multi-model';

export default class NotebookModel extends MultiModel {

    static PLURAL_NAME:string = 'notebooks';
    static DEFAULT_SORT:Object = {stack: 1, name: 1};

}
