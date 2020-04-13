import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import AttendanceRepository from "~/src/server/repository/attendance.repository";
import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceSEntity,
  AttendanceRepository
> {
  constructor(
    protected repositoryService: RepositorySService,
    protected sessionService: SessionSService
  ) {
    super(repositoryService, sessionService);
  }
}
