import _ from "lodash";

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

export interface IFindManyEntityOptions<T extends BaseEntity>
  extends IFindOneEntityOptions<T> {
  take?: number;
  skip?: number;
}

export interface IFindOneEntityOptions<T extends BaseEntity> {
  where?: TFindEntityWhereOptions<T>;
  order?: {
    [P in keyof T]?: "ASC" | "DESC";
  };
  archive?: boolean;
}

export type TFindEntityWhereOptions<T extends BaseEntity> = {
  [P in keyof T]?: TFindEntityWhereColumnOptions<T[P]>;
};

export type TFindEntityWhereColumnOptions<T> =
  | T
  | {
      $eq?: T;
      $ne?: T;
      $lt?: number;
      $lte?: number;
      $gt?: number;
      $gte?: number;
      $between?: [number, number];
      $in?: T[];
    };

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
