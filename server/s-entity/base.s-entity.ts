import { FindConditions, FindManyOptions } from "typeorm";

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
  static params: IBaseSEntityParams<BaseSEntity>;

  createdAt?: Date;
  updatedAt?: Date;
}
