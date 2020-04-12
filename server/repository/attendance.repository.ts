import { EntityRepository } from "typeorm";

import AttendanceSEntity from "~/server/s-entity/attendance.s-entity";
import BaseRepository from "~/server/repository/base.repository";

@EntityRepository(AttendanceSEntity)
export default class AttendanceRepository extends BaseRepository<
  AttendanceSEntity
> {
  SEntityClass = AttendanceSEntity;
}
