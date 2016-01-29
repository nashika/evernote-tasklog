import {MultiTable, MultiTableOptions} from './multi-table';
import TagEntity from "../entities/tag-entity";

export default class TagTable extends MultiTable<TagEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'tags';

}
