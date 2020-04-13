import { injectable } from "inversify";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { Max, Min } from "class-validator";

import AttendanceEntity from "~/src/common/entity/attendance.entity";
import BaseSEntity, {
  IBaseSEntityParams,
} from "~/src/server/s-entity/base.s-entity";

@injectable()
@Entity({ name: AttendanceEntity.params.name })
@Index(["personId", "year", "month", "day"], { unique: true })
export default class AttendanceSEntity extends BaseSEntity {
  static EntityClass = AttendanceEntity;
  static params: IBaseSEntityParams<AttendanceSEntity> = {
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

  @Column("int", { primary: true, generated: true })
  id?: number;

  @Column("int", { nullable: false })
  personId?: number;

  @Column("int", { nullable: false })
  @Min(1)
  @Max(9999)
  year?: number;

  @Column("int", { nullable: false })
  @Min(1)
  @Max(31)
  month?: number;

  @Column("int", { nullable: false })
  @Min(1)
  @Max(31)
  day?: number;

  @Column("int")
  @Min(0)
  @Max(24 * 60)
  arrivalTime?: number;

  @Column("int")
  @Min(0)
  @Max(24 * 60)
  departureTime?: number;

  @Column("int")
  @Min(0)
  @Max(24 * 60)
  restTime?: number;

  @Column("text")
  remarks?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
