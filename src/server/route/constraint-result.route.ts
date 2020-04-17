import { injectable } from "inversify";

import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table.s-service";
import ConstraintResultTable from "~/src/server/table/constraint-result.table";

@injectable()
export default class ConstraintResultRoute extends BaseEntityRoute<
  ConstraintResultEntity,
  ConstraintResultTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
