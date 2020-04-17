import BaseEvernoteEntity from "./base-evernote.entity";
import { IEntityParams } from "./base.entity";

export default class TagEntity extends BaseEvernoteEntity {
  static readonly params: IEntityParams<TagEntity> = {
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
