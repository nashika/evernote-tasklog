import BaseEntity, { IBaseEntityParams } from "./base.entity";

export default class OptionEntity extends BaseEntity {
  static params: IBaseEntityParams<OptionEntity> = {
    name: "option",
    primaryKey: "key",
    displayField: "key",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
  };

  key?: string;
  value?: any;
}
