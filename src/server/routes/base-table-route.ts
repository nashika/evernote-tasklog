import {Request} from "express";

import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseEntityRoute} from "./base-entity-route";
import {TableService} from "../service/table-service";

export abstract class BaseTableRoute<T1 extends BaseEntity, T2 extends BaseTable> extends BaseEntityRoute<T1> {

  constructor(protected tableService: TableService) {
    super();
  }

  getTable(req: Request): T2 {
    return <T2>this.tableService.getUserTable(this.EntityClass, req);
  }

}
