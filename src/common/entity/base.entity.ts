import _ from "lodash";
import { FindManyOptions, FindOneOptions } from "typeorm";

export interface IBaseEntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: keyof T;
  displayField: keyof T;
  archive: boolean;
  default: IFindManyEntityOptions<T>;
  append: IFindManyEntityOptions<T>;
}

export interface IFindManyEntityOptions<T> extends FindManyOptions<T> {
  archive?: boolean;
}

export interface IFindOneEntityOptions<T> extends FindOneOptions<T> {
  archive?: boolean;
}

export default abstract class BaseEntity {
  static params: IBaseEntityParams<any>;

  constructor(data: any = {}) {
    for (const key of _.keys(data)) {
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

  archiveId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}
