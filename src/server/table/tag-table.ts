import {BaseMultiTable} from "./base-multi-table";
import {MultiTableOptions} from "./base-multi-table";
import {TagEntity} from "../../common/entity/tag-entity";

export class TagTable extends BaseMultiTable<TagEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'tags';

}
