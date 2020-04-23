import { injectable } from "inversify";

import ProfitLogEntity from "../../common/entity/profit-log.entity";
import ProfitLogTable from "../table/profit-log.table";
import BaseEntityRoute from "./base-entity.route";
import SessionService from "~/src/server/service/session.service";
import TableService from "~/src/server/service/table.service";

@injectable()
export default class ProfitLogRoute extends BaseEntityRoute<
  ProfitLogEntity,
  ProfitLogTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
