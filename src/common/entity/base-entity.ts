import _ = require("lodash");

export abstract class BaseEntity {

  _id: string;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

}
