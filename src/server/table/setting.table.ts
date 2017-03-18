import {injectable} from "inversify";
import sequelize = require("sequelize");

import {SettingEntity} from "../../common/entity/setting.entity";
import {BaseMultiTable} from "./base-multi.table";
import {IBaseTableParams} from "./base.table";

@injectable()
export class SettingTable extends BaseMultiTable<SettingEntity> {

  static params: IBaseTableParams = {
    fields: {
      key: {type: sequelize.STRING, allowNull: false, unique: true},
      value: {type: sequelize.TEXT, allowNull: false},
    }, options: {
      indexes: [],
    },
    jsonFields: ["value"],
  };

}
