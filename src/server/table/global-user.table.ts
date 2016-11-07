import {injectable} from "inversify";

import {IMultiEntityFindOptions} from "../../common/entity/base-multi.entity";
import {BaseMultiTable} from "./base-multi.table";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

@injectable()
export class GlobalUserTable extends BaseMultiTable<GlobalUserEntity, IMultiEntityFindOptions> {
}
