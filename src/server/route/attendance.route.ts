import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table-s.service";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<AttendanceEntity> {
  constructor(
    protected tableService: TableSService,
    protected sessionService: SessionSService
  ) {
    super(tableService, sessionService);
  }
}
