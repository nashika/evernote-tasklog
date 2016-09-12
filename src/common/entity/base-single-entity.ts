import {BaseEntity} from "./base-entity";

export abstract class BaseSingleEntity extends BaseEntity {

  constructor(data: any) {
    super(data);
    this._id = "1";
  }

}
