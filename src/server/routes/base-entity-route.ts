import {Request} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";
import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";

export abstract class BaseEntityRoute<T1 extends BaseEntity, T2 extends BaseTable> extends BaseRoute {

  static EntityClass: typeof BaseEntity;

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getTable(req: Request): T2 {
    return <T2>core.users[req.session["evernote"].user.username].models[this.Class.EntityClass.params.name];
  }

}
