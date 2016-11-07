import {injectable} from "inversify";

import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {TimeLogTable} from "../table/time-log.table";
import {BaseMultiRoute} from "./base-multi.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class TimeLogRoute extends BaseMultiRoute<TimeLogEntity, TimeLogTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }
}
