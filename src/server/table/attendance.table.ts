import { injectable } from "inversify";

import BaseTable from "~/src/server/table/base.table";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@injectable()
export default class AttendanceTable extends BaseTable<AttendanceEntity> {}
