import { injectable } from "inversify";

import SessionService from "../service/session.service";
import BaseEntityRoute from "./base-entity.route";
import RepositoryService from "~/server/service/repository.service";
import AttendanceRepository from "~/server/repository/attendance.repository";
import AttendanceSEntity from "~/server/s-entity/attendance.s-entity";

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
