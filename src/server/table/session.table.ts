import { injectable } from "inversify";

import { BaseTable } from "~/src/server/table/base.table";
import { SessionEntity } from "~/src/common/entity/session.entity";

@injectable()
export class SessionTable extends BaseTable<SessionEntity> {}
