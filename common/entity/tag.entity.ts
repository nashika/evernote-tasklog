import { BaseEvernoteEntity } from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export class TagEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<TagEntity> = {
    name: "tag",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      where: {},
      order: [["name", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string | null = null;
  parentGuid: string | null = null;
}
