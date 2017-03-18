import sequelize = require("sequelize");

import {BaseEntity, IBaseEntityParams} from "./base.entity";

export interface IBaseMultiEntityParams extends IBaseEntityParams {
  default: IMyFindEntityOptions;
  append: IMyFindEntityOptions;
}

export interface IMyFindEntityOptions extends sequelize.FindOptions {
  where?: IMyWhereEntityOptions;
  order?: TMyOrderEntityOptions;
  archive?: boolean;
}

export interface IMyCountEntityOptions extends sequelize.CountOptions {
  where?: IMyWhereEntityOptions;
  archive?: boolean;
}

export interface IMyDestroyEntityOptions extends sequelize.DestroyOptions {
  where?: IMyWhereEntityOptions;
}

export interface IMyWhereEntityOptions extends sequelize.WhereOptions {
}

export type TMyOrderEntityOptions = [string, "ASC" | "DESC"][];

export abstract class BaseMultiEntity extends BaseEntity {

  static params: IBaseMultiEntityParams;

}
