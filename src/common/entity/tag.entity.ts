import BaseEvernoteEntity from "./base-evernote.entity";
import { EntityParams, EntityToInterface } from "./base.entity";

export default class TagEntity extends BaseEvernoteEntity {
  FIELD_NAMES!: "name" | "parentGuid" | BaseEvernoteEntity["FIELD_NAMES3"];

  // eslint-disable-next-line no-useless-constructor
  constructor(data: EntityToInterface<TagEntity>) {
    super(data);
  }

  static readonly params: EntityParams<TagEntity> = {
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
        nullable: false,
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

  name!: string;
  parentGuid!: string | null;
}
