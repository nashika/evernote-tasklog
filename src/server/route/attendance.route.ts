import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceEntity,
> {
  constructor(
    protected repositoryService: RepositorySService,
    protected sessionService: SessionSService
  ) {
    super(repositoryService, sessionService);
  }
}
