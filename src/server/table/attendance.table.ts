import {injectable} from "inversify";
import sequelize = require("sequelize");

import {IBaseTableParams, BaseTable} from "./base.table";
import {AttendanceEntity} from "../../common/entity/attendance.entity";

@injectable()
export class AttendanceTable extends BaseTable<AttendanceEntity> {

  static params: IBaseTableParams = {
    fields: {
      id: {type: sequelize.INTEGER, primaryKey: true},
      personId: {type: sequelize.INTEGER, allowNull: false},
      year: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 9999}},
      month: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 12}},
      day: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 31}},
      arrivalHour: {type: sequelize.INTEGER, validate: {min: 0, max: 23}},
      arrivalMinute: {type: sequelize.INTEGER, validate: {min: 0, max: 59}},
      departureHour: {type: sequelize.INTEGER, validate: {min: 0, max: 23}},
      departureMinute: {type: sequelize.INTEGER, validate: {min: 0, max: 59}},
      restMinute: {type: sequelize.INTEGER, validate: {min: 0, max: 24 * 60}},
    }, options: {
      indexes: [
        {unique: true, fields: ["personId", "year", "month", "day"]},
      ],
    },
    jsonFields: [],
  };

}
