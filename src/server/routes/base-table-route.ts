import {Request} from "express";

import core from "../core";
import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {BaseEntityRoute} from "./base-entity-route";
import {SessionService} from "../service/session-service";

export abstract class BaseTableRoute<T1 extends BaseEntity, T2 extends BaseTable> extends BaseEntityRoute<T1> {

  constructor(protected sessionService: SessionService) {
    super();
  }

  getTable(req: Request): T2 {
    let session = this.sessionService.get(req);
    return <T2>core.users[session.user.username].models[this.Class.EntityClass.params.name];
  }

}
