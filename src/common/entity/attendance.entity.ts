import {BaseEntity, IBaseEntityParams} from "./base.entity";

export class AttendanceEntity extends BaseEntity {

  static params: IBaseEntityParams = {
    name: "attendance",
    primaryKey: "id",
    displayField: "id",
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

  id: number;
  personId: number;
  year: number;
  month: number;
  day: number;
  arrivalHour: number;
  arrivalMinute: number;
  departureHour: number;
  departureMinute: number;
  restMinute: number;

}
