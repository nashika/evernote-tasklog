import { FindConditions, FindManyOptions } from "typeorm";
import BaseEntity from "~/src/common/entity/base.entity";

export interface IBaseSEntityParams<T extends BaseSEntity> {
  name: string;
  primaryKey: string;
  displayField: string;
  archive: boolean;
  default: any; // IFindEntityOptions<T>;
  append: any; // IFindEntityOptions<T>;
}

export interface IFindManyEntityOptions<T extends BaseSEntity>
  extends FindManyOptions<T> {
  archive?: boolean;
}

export type TDeleteEntityOptions<T extends BaseSEntity> = FindConditions<T>;

export default abstract class BaseSEntity {
  static EntityClass: typeof BaseEntity;
  static params: IBaseSEntityParams<BaseSEntity>;

  createdAt?: Date;
  updatedAt?: Date;
}
