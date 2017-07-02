import {injectable} from "inversify";

import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {ProfitLogTable} from "../table/profit-log.table";
import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class ProfitLogRoute extends BaseEntityRoute<ProfitLogEntity, ProfitLogTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

}
