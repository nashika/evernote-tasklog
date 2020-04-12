import { BaseEntity, IBaseEntityParams } from "./base.entity";

export default class AttendanceEntity extends BaseEntity {
  static params: IBaseEntityParams<AttendanceEntity> = {
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

  id?: number;
  personId?: number;
  year?: number;
  month?: number;
  day?: number;
  arrivalTime?: number;
  departureTime?: number;
  restTime?: number;
  remarks?: string;
}
