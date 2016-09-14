import {Request} from "express";

import core from "../core";
import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {serverServiceRegistry} from "../service/server-service-registry";
import {BaseEntityRoute} from "./base-entity-route";

export abstract class BaseTableRoute<T1 extends BaseEntity, T2 extends BaseTable> extends BaseEntityRoute<T1> {

  getTable(req: Request): T2 {
    let session = serverServiceRegistry.session.get(req);
    return <T2>core.users[session.user.username].models[this.Class.EntityClass.params.name];
  }

}
