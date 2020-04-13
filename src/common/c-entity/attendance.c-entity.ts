import BaseCEntity, { IBaseCEntityParams } from "./base.c-entity";

export default class AttendanceCEntity extends BaseCEntity {
  static params: IBaseCEntityParams<AttendanceCEntity> = {
    name: "attendance",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
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
