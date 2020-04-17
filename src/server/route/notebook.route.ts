import { injectable } from "inversify";

import BaseEntityRoute from "~/src/server/route/base-entity.route";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import NotebookTable from "~/src/server/table/notebook.table";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table-s.service";

@injectable()
export default class NotebookRoute extends BaseEntityRoute<
  NotebookEntity,
  NotebookTable
> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
