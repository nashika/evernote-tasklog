import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {TagTable} from "../table/tag.table";
import {TagEntity} from "../../common/entity/tag.entity";

@injectable()
export class TagRoute extends BaseEntityRoute<TagEntity, TagTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
