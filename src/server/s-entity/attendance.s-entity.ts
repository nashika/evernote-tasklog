import { EntitySchema } from "typeorm";

import AttendanceEntity from "~/src/common/entity/attendance.entity";

const AttendanceSEntity = new EntitySchema<AttendanceEntity>({
  name: "attendance",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    personId: {
      type: "int",
      nullable: false,
    },
    year: {
      type: "int",
      nullable: false,
    },
    month: {
      type: "int",
      nullable: false,
    },
    day: {
      type: "int",
      nullable: false,
    },
    arrivalTime: {
      type: "int",
    },
    departureTime: {
      type: "int",
    },
    restTime: {
      type: "int",
    },
    remarks: {
      type: "text",
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
  indices: [
    {
      columns: ["personId", "year", "month", "day"],
      unique: true,
    },
  ],
});
export default AttendanceSEntity;
