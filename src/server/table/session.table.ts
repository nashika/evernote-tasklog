import { injectable } from "inversify";

import BaseTable from "~/src/server/table/base.table";
import SessionEntity from "~/src/common/entity/session.entity";

@injectable()
export default class SessionTable extends BaseTable<SessionEntity> {}
