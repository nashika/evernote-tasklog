import {injectable} from "inversify";

import {BaseMultiRoute} from "./base-multi.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {TagTable} from "../table/tag.table";
import {TagEntity} from "../../common/entity/tag.entity";

@injectable()
export class TagRoute extends BaseMultiRoute<TagEntity, TagTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
