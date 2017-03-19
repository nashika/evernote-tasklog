import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseMultiTable} from "./base-multi.table";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {IBaseTableParams} from "./base.table";

@injectable()
export class GlobalUserTable extends BaseMultiTable<GlobalUserEntity> {

  static params: IBaseTableParams = {
    fields: {
      key: {type: sequelize.STRING, primaryKey: true},
      sandbox: {type: sequelize.BOOLEAN, allowNull: false},
      username: {type: sequelize.STRING, allowNull: false},
      token: {type: sequelize.STRING, allowNull: false},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

}
