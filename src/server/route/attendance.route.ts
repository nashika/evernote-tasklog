import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table.s-service";
import AttendanceEntity from "~/src/common/entity/attendance.entity";
import AttendanceTable from "~/src/server/table/attendance.table";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceEntity,
  AttendanceTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
