import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import AttendanceRepository from "~/src/server/repository/attendance.repository";
import AttendanceCEntity from "~/src/common/c-entity/attendance.c-entity";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceCEntity,
  AttendanceRepository
> {
  constructor(
    protected repositoryService: RepositorySService,
    protected sessionService: SessionSService
  ) {
    super(repositoryService, sessionService);
  }
}
