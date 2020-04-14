import { EntityRepository } from "typeorm";

import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";
import BaseRepository from "~/src/server/repository/base.repository";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@EntityRepository(AttendanceSEntity)
export default class AttendanceRepository extends BaseRepository<
  AttendanceEntity
> {
  EntityClass = AttendanceEntity;
}
