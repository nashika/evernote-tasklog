import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi-entity";

export class SettingEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "setting",
    titleField: "name",
    requireUser: true,
    default: {
      query: {},
      sort: {updated: -1},
      limit: 500,
    },
    append: {
      query: {},
      sort: {},
    },
  };

  value: any;

}
