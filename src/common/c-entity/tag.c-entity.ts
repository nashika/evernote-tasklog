import BaseEvernoteCEntity from "./base-evernote.c-entity";
import { IBaseCEntityParams } from "./base.c-entity";

export default class TagCEntity extends BaseEvernoteCEntity {
  static params: IBaseCEntityParams<TagCEntity> = {
    name: "tag",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      order: { name: "ASC" },
      take: 500,
    },
    append: {},
  };

  name?: string;
  parentGuid?: string;
}
