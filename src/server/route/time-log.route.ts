import { injectable } from "inversify";

import TimeLogEntity from "~/src/common/entity/time-log.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TimeLogTable from "~/src/server/table/time-log.table";
import SessionService from "~/src/server/service/session.service";
import TableService from "~/src/server/service/table.service";

@injectable()
export default class TimeLogRoute extends BaseEntityRoute<
  TimeLogEntity,
  TimeLogTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
