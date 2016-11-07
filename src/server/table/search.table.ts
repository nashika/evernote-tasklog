import {injectable} from "inversify";

import {SearchEntity} from "../../common/entity/serch.entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";

@injectable()
export class SearchTable extends BaseMultiEvernoteTable<SearchEntity, IMultiEntityFindOptions> {
}
