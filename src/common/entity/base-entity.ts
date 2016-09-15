import _ = require("lodash");

export interface IBaseEntityParams {
  name: string;
  titleField: string;
  requireUser: boolean;
}

export abstract class BaseEntity {

  static params:IBaseEntityParams;

  _id: string;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

}
