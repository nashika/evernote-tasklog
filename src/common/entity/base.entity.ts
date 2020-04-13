import _ from "lodash";

export interface IBaseEntityParams<T extends BaseEntity> {
  name: string;
  primaryKey: string;
  displayField: string;
  archive: boolean;
  default: any; // IFindEntityOptions<T>;
  append: any; // IFindEntityOptions<T>;
}

export default abstract class BaseEntity {
  static params: IBaseEntityParams<any>;

  archiveId?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: any = {}) {
    for (const key of _.keys(data)) {
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
