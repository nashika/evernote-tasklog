import { BaseEntity, IBaseEntityParams } from "./base.entity";

export class OptionEntity extends BaseEntity {
  static params: IBaseEntityParams<OptionEntity> = {
    name: "option",
    primaryKey: "key",
    displayField: "key",
    archive: false,
    default: {
      where: {},
      order: [],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  key?: string;
  value?: any;
}
