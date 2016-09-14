import _ = require("lodash");

import {BaseRoute} from "./base-route";
import {BaseEntity} from "../../common/entity/base-entity";

export abstract class BaseEntityRoute<T extends BaseEntity> extends BaseRoute {

  static EntityClass: typeof BaseEntity;

  get Class(): typeof BaseEntityRoute {
    return <typeof BaseEntityRoute>this.constructor;
  }

  getBasePath(): string {
    return "/" + _.kebabCase(this.Class.EntityClass.params.name);
  }

}
