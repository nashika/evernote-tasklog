import {BaseEntity} from "./base-entity";

export interface IMultiEntityFindOptions {
  query?: Object;
  sort?: {[key: string]: number}|string;
  limit?: number;
}

export abstract class BaseMultiEntity extends BaseEntity {
}
