import {injectable} from "inversify";

import {OptionEntity} from "../../common/entity/option.entity";
import {OptionTable} from "../table/option.table";
import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class OptionRoute extends BaseEntityRoute<OptionEntity, OptionTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
