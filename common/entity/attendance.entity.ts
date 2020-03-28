import { BaseEntity, IBaseEntityParams } from "./base.entity";

export class AttendanceEntity extends BaseEntity {
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

  id: number | null = null;
  personId: number | null = null;
  year: number | null = null;
  month: number | null = null;
  day: number | null = null;
  arrivalTime: number | null = null;
  departureTime: number | null = null;
  restTime: number | null = null;
  remarks: string | null = null;
}
