import {BaseEntity, IBaseEntityParams} from "./base.entity";

export interface IBaseMultiEntityParams extends IBaseEntityParams {
  default: {
    query: INedbQuery;
    sort: TNedbSort;
    limit: number
  }
  append: {
    query: INedbQuery;
    sort: TNedbSort;
  };
}

export interface IMultiEntityFindOptions {
  query?: INedbQuery;
  sort?: TNedbSort;
  limit?: number;
  archive?: boolean;
}

export interface INedbQuery {
  $and?: INedbQuery[];
  $or?: INedbQuery[];
  $where?: Function;
  [columnName: string]: INedbQuery[] | INedbColumnQuery;
}

export interface INedbColumnQuery {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $in?: TNedbValueType[];
  $ne?: TNedbValueType;
  $nin?: TNedbValueType[];
  $exists?: boolean;
  $regex?: RegExp;
}

export type TNedbValueType = string | number;

export type TNedbSort = {[columnName: string]: number} | string;

export abstract class BaseMultiEntity extends BaseEntity {

  static params: IBaseMultiEntityParams;

}
