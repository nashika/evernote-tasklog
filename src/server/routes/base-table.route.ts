import {Request} from "express";

import {BaseTable} from "../table/base.table";
import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {BaseEntity} from "../../common/entity/base.entity";

export abstract class BaseTableRoute<T extends BaseTable<BaseEntity>> extends BaseEntityRoute {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super();
  }

  getTable(req: Request): T {
    let session = this.sessionService.get(req);
    if (this.EntityClass.params.requireUser) {
      return <T>this.tableService.getUserTable(this.EntityClass, session.globalUser);
    } else {
      return <T>this.tableService.getGlobalTable(this.EntityClass);
    }
  }

}
