import _ = require("lodash");
import sequelize = require("sequelize");

export interface IBaseEntityParams {
  name: string;
  primaryKey: string;
  displayField: string;
  requireUser: boolean;
  archive: boolean;
  default: IFindEntityOptions;
  append: IFindEntityOptions;
}

export interface IFindEntityOptions extends sequelize.FindOptions {
  where?: IWhereEntityOptions;
  order?: TOrderEntityOptions;
  archive?: boolean;
}

export interface ICountEntityOptions extends sequelize.CountOptions {
  where?: IWhereEntityOptions;
  archive?: boolean;
}

export interface IDestroyEntityOptions extends sequelize.DestroyOptions {
  where?: IWhereEntityOptions;
}

export interface IWhereEntityOptions extends sequelize.WhereOptions {
}

export type TOrderEntityOptions = [string, "ASC" | "DESC"][];

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
