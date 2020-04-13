import { injectable } from "inversify";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { Max, Min } from "class-validator";

import AttendanceCEntity from "~/src/common/c-entity/attendance.c-entity";
import BaseSEntity from "~/src/server/s-entity/base.s-entity";

@injectable()
@Entity({ name: AttendanceCEntity.params.name })
@Index(["personId", "year", "month", "day"], { unique: true })
export default class AttendanceSEntity extends BaseSEntity {
  static CEntityClass = AttendanceCEntity;

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
