import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionService from "~/src/server/service/session.service";
import RepositoryService from "~/src/server/service/repository.service";
import AttendanceRepository from "~/src/server/repository/attendance.repository";
import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceSEntity,
  AttendanceRepository
> {
  constructor(
    protected repositoryService: RepositoryService,
    protected sessionService: SessionService
  ) {
    super(repositoryService, sessionService);
  }
}
