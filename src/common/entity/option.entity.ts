import BaseEntity, { EntityParams } from "./base.entity";

export default class OptionEntity extends BaseEntity {
  static readonly params: EntityParams<OptionEntity> = {
    name: "option",
    primaryKey: "key",
    displayField: "key",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
    columns: {
      key: {
        type: "string",
        primary: true,
        nullable: false,
      },
      value: {
        type: "text",
        nullable: true,
      },
    },
    jsonFields: ["value"],
  };

  key!: string;
  value!: any | null;
}
