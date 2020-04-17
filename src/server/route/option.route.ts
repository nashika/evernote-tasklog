import { injectable } from "inversify";

import OptionTable from "~/src/server/table/option.table";
import OptionEntity from "~/src/common/entity/option.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TableSService from "~/src/server/s-service/table.s-service";
import SessionSService from "~/src/server/s-service/session.s-service";

@injectable()
export default class OptionRoute extends BaseEntityRoute<
  OptionEntity,
  OptionTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
