import {BaseEntity, IBaseEntityParams} from "./base-entity";

export interface IBaseSingleEntityParams extends IBaseEntityParams {
  defaultDoc: Object;
}

export abstract class BaseSingleEntity extends BaseEntity {

  static params: IBaseSingleEntityParams;

  constructor(data: any) {
    super(data);
    this._id = "1";
  }

}
