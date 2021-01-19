import { injectable } from "inversify";

import { BaseEntityRoute } from "~/src/server/route/base-entity.route";
import { NotebookEntity } from "~/src/common/entity/notebook.entity";
import { NotebookTable } from "~/src/server/table/notebook.table";
import { SessionService } from "~/src/server/service/session.service";
import { TableService } from "~/src/server/service/table.service";

@injectable()
export class NotebookRoute extends BaseEntityRoute<
  NotebookEntity,
  NotebookTable
> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
