import { injectable } from "inversify";

import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import SessionService from "~/src/server/service/session.service";
import TableService from "~/src/server/service/table.service";
import ConstraintResultTable from "~/src/server/table/constraint-result.table";

@injectable()
export default class ConstraintResultRoute extends BaseEntityRoute<
  ConstraintResultEntity,
  ConstraintResultTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
