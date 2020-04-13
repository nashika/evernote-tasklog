import _ from "lodash";
import { FindConditions, FindManyOptions } from "typeorm";

export interface IBaseCEntityParams<T extends BaseCEntity> {
  name: string;
  primaryKey: string;
  displayField: string;
  archive: boolean;
  default: IFindManyCEntityOptions<T>;
  append: IFindManyCEntityOptions<T>;
}

export interface IFindManyCEntityOptions<T> extends FindManyOptions<T> {
  archive?: boolean;
}

export type TDeleteCEntityOptions<T> = FindConditions<T>;

export default abstract class BaseCEntity {
  static params: IBaseCEntityParams<any>;

  constructor(data: any = {}) {
    for (const key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

  get Class(): typeof BaseCEntity {
    return <typeof BaseCEntity>this.constructor;
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
