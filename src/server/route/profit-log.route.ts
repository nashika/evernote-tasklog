import { injectable } from "inversify";

import ProfitLogEntity from "../../common/entity/profit-log.entity";
import ProfitLogTable from "../table/profit-log.table";
import BaseEntityRoute from "./base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table-s.service";

@injectable()
export default class ProfitLogRoute extends BaseEntityRoute<
  ProfitLogEntity,
  ProfitLogTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
