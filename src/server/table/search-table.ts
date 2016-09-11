import {BaseMultiTable} from "./base-multi-table";
import {MultiTableOptions} from "./base-multi-table";
import {SearchEntity} from "../../common/entity/serch-entity";

export class SearchTable extends BaseMultiTable<SearchEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'searches';

}
