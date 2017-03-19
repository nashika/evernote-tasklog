import _ = require("lodash");
import sequelize = require("sequelize");

export interface IBaseEntityParams {
  name: string;
  primaryKey: string;
  displayField: string;
  requireUser: boolean;
  archive: boolean;
  default: IMyFindEntityOptions;
  append: IMyFindEntityOptions;
}

export interface IMyFindEntityOptions extends sequelize.FindOptions {
  where?: IMyWhereEntityOptions;
  order?: TMyOrderEntityOptions;
  archive?: boolean;
}

export interface IMyCountEntityOptions extends sequelize.CountOptions {
  where?: IMyWhereEntityOptions;
  archive?: boolean;
}

export interface IMyDestroyEntityOptions extends sequelize.DestroyOptions {
  where?: IMyWhereEntityOptions;
}

export interface IMyWhereEntityOptions extends sequelize.WhereOptions {
}

export type TMyOrderEntityOptions = [string, "ASC" | "DESC"][];

export abstract class BaseEntity {

  static params: IBaseEntityParams;

  archiveId?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

  get Class(): typeof BaseEntity {
    return <typeof BaseEntity>this.constructor;
  }

  get primaryKey(): any {
    return _.get(this, this.Class.params.primaryKey);
  }

  get displayField(): any {
    return _.get(this, this.Class.params.displayField);
  }

}
