import { EntityRepository } from "typeorm";

import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";
import BaseRepository from "~/src/server/repository/base.repository";
import AttendanceCEntity from "~/src/common/c-entity/attendance.c-entity";

@EntityRepository(AttendanceSEntity)
export default class AttendanceRepository extends BaseRepository<
  AttendanceCEntity
> {
  CEntityClass = AttendanceCEntity;
}
