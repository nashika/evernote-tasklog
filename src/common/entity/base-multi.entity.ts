import {BaseEntity, IBaseEntityParams} from "./base.entity";

export interface IBaseMultiEntityParams extends IBaseEntityParams {
  default: {
    query: Object;
    sort: Object;
    limit: number
  }
  append: {
    query: Object;
    sort: Object;
  };
}

export interface IMultiEntityFindOptions {
  query?: Object;
  sort?: {[key: string]: number}|string;
  limit?: number;
}

export abstract class BaseMultiEntity extends BaseEntity {

  static params: IBaseMultiEntityParams;

}
