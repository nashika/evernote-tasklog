import _ = require("lodash");

import {BaseRoute} from "./base.route";
import {BaseEntity} from "../../common/entity/base.entity";
import {kernel} from "../inversify.config";

export abstract class BaseEntityRoute extends BaseRoute {

  EntityClass: typeof BaseEntity;

  constructor() {
    super();
    let name = _.lowerFirst(_.replace(this.Class.name, /Route$/, ""));
    this.EntityClass = <any>kernel.getNamed(BaseEntity, name);
  }

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return "/" + _.kebabCase(this.EntityClass.params.name);
  }

}
