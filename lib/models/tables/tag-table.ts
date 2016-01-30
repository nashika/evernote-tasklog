import {MultiTable} from "./multi-table";
import {MultiTableOptions} from "./multi-table";
import {TagEntity} from "../entities/tag-entity";

export class TagTable extends MultiTable<TagEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'tags';

}
