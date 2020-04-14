import { Max, Min } from "class-validator";
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

  @Min(1)
  @Max(9999)
  year?: number;

  @Min(1)
  @Max(31)
  month?: number;

  @Min(1)
  @Max(31)
  day?: number;

  @Min(0)
  @Max(24 * 60)
  arrivalTime?: number;

  @Min(0)
  @Max(24 * 60)
  departureTime?: number;

  @Min(0)
  @Max(24 * 60)
  restTime?: number;

  remarks?: string;
}
