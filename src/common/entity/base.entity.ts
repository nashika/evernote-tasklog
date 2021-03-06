import _ from "lodash";

export interface EntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: keyof T;
  displayField: keyof T;
  archive: boolean;
  default: FindManyEntityOptions<T>;
  append: FindManyEntityOptions<T>;
  columns?: {
    [P in keyof T | string]: EntityColumnParams;
  };
  indicies?: {
    name: string;
    columns: string[];
    unique?: boolean;
  }[];
  jsonFields?: string[];
}

export interface EntityColumnParams {
  type: EntityColumnType;
  primary?: boolean;
  generated?: true;
  nullable: boolean;
}

export type TEntityClass<T extends BaseEntity> = {
  new (data: any): T;
  readonly params: EntityParams<T>;
};

export type EntityToInterface<T extends BaseEntity> = Pick<T, T["FIELD_NAMES"]>;

export type EntityColumnType =
  | "integer"
  | "real"
  | "boolean"
  | "string"
  | "text"
  | "date"
  | "datetime";

export interface FindManyEntityOptions<T extends BaseEntity>
  extends FindOneEntityOptions<T> {
  take?: number;
  skip?: number;
}

export interface FindOneEntityOptions<T extends BaseEntity> {
  where?: FindEntityWhereOptions<T>;
  order?: {
    [P in keyof T]?: "ASC" | "DESC";
  };
  archive?: boolean;
}

export type FindEntityWhereOptions<T extends BaseEntity> = {
  [P in keyof T]?: FindEntityWhereColumnOptions<T[P]>;
};

export type FindEntityWhereColumnOptions<
  P extends string | number | Date | null
> = P | FindEntityWhereColumnOperators<P>;

export type FindEntityWhereColumnOperators<
  P extends string | number | Date | null
> = {
  $eq?: P;
  $ne?: P;
  $lt?: P extends number ? P : never;
  $lte?: P extends number ? P : never;
  $gt?: P extends number ? P : never;
  $gte?: P extends number ? P : never;
  $between?: P extends number | Date ? [P, P] : never;
  $in?: P[];
};

export abstract class BaseEntity {
  FIELD_NAMES!: string;
  FIELD_NAMES2!: "archiveId" | "createdAt" | "updatedAt";
  static readonly params: EntityParams<BaseEntity>;

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
  createdAt?: Date | number;
  updatedAt?: Date | number;
  [key: string]: any;
}
