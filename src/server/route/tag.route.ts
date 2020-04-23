import { injectable } from "inversify";

import TagEntity from "~/src/common/entity/tag.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TagTable from "~/src/server/table/tag.table";
import SessionService from "~/src/server/service/session.service";
import TableService from "~/src/server/service/table.service";

@injectable()
export default class TagRoute extends BaseEntityRoute<TagEntity, TagTable> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService
  ) {
    super(tableService, sessionService);
  }
}
