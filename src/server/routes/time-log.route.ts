import {injectable} from "inversify";

import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {TimeLogTable} from "../table/time-log.table";
import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class TimeLogRoute extends BaseEntityRoute<TimeLogEntity, TimeLogTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }
}
