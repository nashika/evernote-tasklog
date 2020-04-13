import { EntityRepository } from "typeorm";

import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";
import BaseRepository from "~/src/server/repository/base.repository";

@EntityRepository(AttendanceSEntity)
export default class AttendanceRepository extends BaseRepository<
  AttendanceSEntity
> {
  SEntityClass = AttendanceSEntity;
}
