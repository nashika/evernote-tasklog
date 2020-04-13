import BaseCEntity, { IBaseCEntityParams } from "./base.c-entity";

export default class OptionCEntity extends BaseCEntity {
  static params: IBaseCEntityParams<OptionCEntity> = {
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
