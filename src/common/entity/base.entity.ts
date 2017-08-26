import _ = require("lodash");
import sequelize = require("sequelize");

export interface IBaseEntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: string;
  displayField: string;
  archive: boolean;
  default: IFindEntityOptions<T>;
  append: IFindEntityOptions<T>;
}

export interface IFindEntityOptions<T extends BaseEntity> extends sequelize.FindOptions<T> {
  archive?: boolean;
}

export interface ICountEntityOptions extends sequelize.CountOptions {
  archive?: boolean;
}

export interface IDestroyEntityOptions extends sequelize.DestroyOptions {
}

export abstract class BaseEntity {

  static params: IBaseEntityParams<any>;

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
