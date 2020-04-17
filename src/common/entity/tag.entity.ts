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
    columns: {
      guid: {
        type: "string",
        primary: true,
      },
      name: {
        type: "string",
        nullable: false,
      },
      parentGuid: {
        type: "string",
        nullable: true,
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
    },
  };

  name?: string;
  parentGuid?: string;
}
