import { injectable } from "inversify";
import sequelize from "sequelize";

import { IBaseTableParams, BaseTable } from "./base.table";
import { ConstraintResultEntity } from "~/common/entity/constraint-result.entity";

@injectable()
export class ConstraintResultTable extends BaseTable<ConstraintResultEntity> {
  static params: IBaseTableParams = {
    fields: {
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      noteGuid: { type: sequelize.STRING, allowNull: false },
      constraintId: { type: sequelize.INTEGER, allowNull: false },
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };
}
