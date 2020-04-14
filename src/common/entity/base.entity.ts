import _ from "lodash";
import { FindConditions, FindManyOptions } from "typeorm";

export interface IBaseEntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: string;
  displayField: string;
  archive: boolean;
  default: IFindManyEntityOptions<T>;
  append: IFindManyEntityOptions<T>;
}

export interface IFindManyEntityOptions<T> extends FindManyOptions<T> {
  archive?: boolean;
}

export type TDeleteEntityOptions<T> = FindConditions<T>;

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
}
