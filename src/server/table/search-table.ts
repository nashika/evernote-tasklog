import {SearchEntity} from "../../common/entity/serch-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

export class SearchTable extends BaseMultiEvernoteTable<SearchEntity, IMultiEntityFindOptions> {

  static EntityClass = SearchEntity;
  static PLURAL_NAME: string = 'searches';

}
