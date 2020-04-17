import { injectable } from "inversify";

import TimeLogEntity from "~/src/common/entity/time-log.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TimeLogTable from "~/src/server/table/time-log.table";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table.s-service";

@injectable()
export default class TimeLogRoute extends BaseEntityRoute<
  TimeLogEntity,
  TimeLogTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
