import _ = require("lodash");

export interface IBaseEntityParams {
  name: string;
  titleField: string;
  requireUser: boolean;
  archive: boolean;
}

export abstract class BaseEntity {

  static params:IBaseEntityParams;

  id: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

}
