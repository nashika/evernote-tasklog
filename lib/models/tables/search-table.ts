import {MultiTable} from "./multi-table";
import {MultiTableOptions} from "./multi-table";
import {SearchEntity} from "../entities/serch-entity";

export class SearchTable extends MultiTable<SearchEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'searches';

}
