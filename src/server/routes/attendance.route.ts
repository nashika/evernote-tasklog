import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {AttendanceEntity} from "../../common/entity/attendance.entity";
import {AttendanceTable} from "../table/attendance.table";

@injectable()
export class AttendanceRoute extends BaseEntityRoute<AttendanceEntity, AttendanceTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }
}
