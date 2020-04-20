import _ from "lodash";
import { FindManyOptions, FindOneOptions } from "typeorm";

export interface IEntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: keyof T;
  displayField: keyof T;
  archive: boolean;
  default: IFindManyEntityOptions<T>;
  append: IFindManyEntityOptions<T>;
  columns?: {
    [P in keyof T | string]: IEntityColumnParams<T>;
  };
  indicies?: {
    columns: string[];
    unique?: boolean;
  }[];
  jsonFields?: string[];
}

export interface IEntityColumnParams<T extends BaseEntity> {
  type: IEntityColumnType;
  primary?: boolean;
  generated?: true;
  nullable: boolean;
}

export type IEntityColumnType =
  | "integer"
  | "real"
  | "boolean"
  | "string"
  | "text"
  | "date"
  | "datetime";

export interface IFindManyEntityOptions<T> extends FindManyOptions<T> {
  archive?: boolean;
}

export interface IFindOneEntityOptions<T> extends FindOneOptions<T> {
  archive?: boolean;
}

export default abstract class BaseEntity {
  static readonly params: IEntityParams<BaseEntity>;

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
  createdAt!: Date;
  updatedAt!: Date;
  [key: string]: any;
}
