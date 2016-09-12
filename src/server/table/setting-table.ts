import {SettingEntity} from "../../common/entity/setting-entity";
import {BaseMultiTable, MultiTableOptions} from "./base-multi-table";

export interface SettingTableOptions extends MultiTableOptions {
  key?: string;
}

export class SettingTable extends BaseMultiTable<SettingEntity, SettingTableOptions> {

  static PLURAL_NAME: string = 'settings';
  static REQUIRE_USER: boolean = false;
  static EntityClass = SettingEntity;

}
