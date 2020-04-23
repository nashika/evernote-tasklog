import { injectable } from "inversify";

import OptionTable from "~/src/server/table/option.table";
import OptionEntity from "~/src/common/entity/option.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TableService from "~/src/server/service/table.service";
import SessionService from "~/src/server/service/session.service";

@injectable()
export default class OptionRoute extends BaseEntityRoute<
  OptionEntity,
  OptionTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
