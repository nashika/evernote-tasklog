import {BaseMultiEntity} from "./base-multi-entity";
import {IEntityParams} from "./base-entity";

export class SettingEntity extends BaseMultiEntity {

  static params:IEntityParams = {
    name: "setting",
  };

  value: any;

}
