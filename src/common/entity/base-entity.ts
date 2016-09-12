import _ = require("lodash");

export interface IEntityParams {
  name: string;
}

export abstract class BaseEntity {

  static params:IEntityParams;

  _id: string;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

}
