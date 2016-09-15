import {injectable} from "inversify";

import {SettingEntity} from "../../common/entity/setting-entity";
import {BaseMultiTable} from "./base-multi-table";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";

export interface SettingTableOptions extends IMultiEntityFindOptions {
  key?: string;
}

@injectable()
export class SettingTable extends BaseMultiTable<SettingEntity, SettingTableOptions> {

  static PLURAL_NAME: string = 'settings';
  static REQUIRE_USER: boolean = false;

}
