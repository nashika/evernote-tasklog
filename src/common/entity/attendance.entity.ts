import { BaseEntity, EntityParams } from "./base.entity";

export class AttendanceEntity extends BaseEntity {
  FIELD_NAMES!:
    | "id"
    | "personId"
    | "year"
    | "month"
    | "day"
    | "arrivalTime"
    | "departureTime"
    | "restTime"
    | "remarks"
    | BaseEntity["FIELD_NAMES"];

  static readonly params: EntityParams<AttendanceEntity> = {
    name: "attendance",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
    columns: {
      id: {
        type: "integer",
        primary: true,
        generated: true,
        nullable: false,
      },
      personId: {
        type: "integer",
        nullable: false,
      },
      year: {
        type: "integer",
        nullable: false,
      },
      month: {
        type: "integer",
        nullable: false,
      },
      day: {
        type: "integer",
        nullable: false,
      },
      arrivalTime: {
        type: "integer",
        nullable: true,
      },
      departureTime: {
        type: "integer",
        nullable: true,
      },
      restTime: {
        type: "integer",
        nullable: true,
      },
      remarks: {
        type: "text",
        nullable: true,
      },
    },
    indicies: [
      {
        name: "unique",
        columns: ["personId", "year", "month", "day"],
        unique: true,
      },
    ],
  };

  id!: number;
  personId!: number;
  year!: number;
  month!: number;
  day!: number;
  arrivalTime!: number | null;
  departureTime!: number | null;
  restTime!: number | null;
  remarks!: string | null;
}
