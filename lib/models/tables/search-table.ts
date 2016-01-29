import {MultiTable, MultiTableOptions} from './multi-table';
import SearchEntity from "../entities/serch-entity";

export default class SearchTable extends MultiTable<SearchEntity, MultiTableOptions> {

    static PLURAL_NAME:string = 'searches';

}
