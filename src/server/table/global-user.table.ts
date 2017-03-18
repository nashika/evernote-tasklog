import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseMultiTable} from "./base-multi.table";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class GlobalUserTable extends BaseMultiTable<GlobalUserEntity> {

  protected fields: sequelize.DefineAttributes = {
    sandbox: {type: sequelize.BOOLEAN, allowNull: false},
    username: {type: sequelize.STRING, allowNull: false},
    token: {type: sequelize.STRING, allowNull: false},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<GlobalUserEntity>> = {
    indexes: [],
  };

}
