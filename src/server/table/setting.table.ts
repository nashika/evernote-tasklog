import {injectable} from "inversify";
import sequelize = require("sequelize");

import {SettingEntity} from "../../common/entity/setting.entity";
import {BaseMultiTable} from "./base-multi.table";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class SettingTable extends BaseMultiTable<SettingEntity> {

  protected fields: sequelize.DefineAttributes = {
    sandbox: {type: sequelize.BOOLEAN, allowNull: false},
    username: {type: sequelize.STRING, allowNull: false},
    token: {type: sequelize.STRING, allowNull: false},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<SettingEntity>> = {
    indexes: [],
  };

}
