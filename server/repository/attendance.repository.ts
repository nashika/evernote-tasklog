import { EntityRepository, getCustomRepository } from "typeorm";

import { AttendanceSEntity } from "~/server/s-entity/attendance.s-entity";
import { BaseRepository } from "~/server/repository/base.repository";

@EntityRepository(AttendanceSEntity)
export class AttendanceRepository extends BaseRepository<AttendanceSEntity> {
  SEntityClass = AttendanceSEntity;
}

export const attendanceRepository = getCustomRepository(AttendanceRepository);
