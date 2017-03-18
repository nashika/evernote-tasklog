import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class SettingEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "setting",
    titleField: "name",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  key: string;
  value: any;

}
