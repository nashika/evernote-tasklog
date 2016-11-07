import {injectable} from "inversify";

import {TagEntity} from "../../common/entity/tag.entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {BaseMultiEvernoteTable} from "./base-multi-evernote.table";

@injectable()
export class TagTable extends BaseMultiEvernoteTable<TagEntity, IMultiEntityFindOptions> {
}
