import _ = require("lodash");

export interface IBaseEntityParams {
  name: string;
  primaryKey: string;
  displayField: string;
  requireUser: boolean;
  archive: boolean;
}

export abstract class BaseEntity {

  static params: IBaseEntityParams;

  archiveId?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any = {}) {
    for (let key of _.keys(data)) {
      _.set(this, key, data[key]);
    }
  }

  get Class(): typeof BaseEntity {
    return <typeof BaseEntity>this.constructor;
  }

  get primaryKey(): any {
    return _.get(this, this.Class.params.primaryKey);
  }

  get displayField(): any {
    return _.get(this, this.Class.params.displayField);
  }

}
