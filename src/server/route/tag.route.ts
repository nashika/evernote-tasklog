import { injectable } from "inversify";

import TagEntity from "~/src/common/entity/tag.entity";
import BaseEntityRoute from "~/src/server/route/base-entity.route";
import TagTable from "~/src/server/table/tag.table";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table.s-service";

@injectable()
export default class TagRoute extends BaseEntityRoute<TagEntity, TagTable> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService
  ) {
    super(tableSService, sessionSService);
  }
}
