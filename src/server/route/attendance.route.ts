import { injectable } from "inversify";

import BaseEntityRoute from "./base-entity.route";
import SessionService from "~/src/server/service/session.service";
import TableService from "~/src/server/service/table.service";
import AttendanceEntity from "~/src/common/entity/attendance.entity";
import AttendanceTable from "~/src/server/table/attendance.table";

@injectable()
export default class AttendanceRoute extends BaseEntityRoute<
  AttendanceEntity,
  AttendanceTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
