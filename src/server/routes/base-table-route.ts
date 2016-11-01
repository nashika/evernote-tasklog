import {Request} from "express";

import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseEntityRoute} from "./base-entity-route";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";

export abstract class BaseTableRoute<T1 extends BaseEntity, T2 extends BaseTable> extends BaseEntityRoute<T1> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super();
  }

  getTable(req: Request): T2 {
    let session = this.sessionService.get(req);
    if (this.EntityClass.params.requireUser) {
      return <T2>this.tableService.getUserTable(this.EntityClass, session.globalUser);
    } else {
      return <T2>this.tableService.getGlobalTable(this.EntityClass);
    }
  }

}
