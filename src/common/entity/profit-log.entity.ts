import BaseEntity, { EntityParams } from "./base.entity";

export default class ProfitLogEntity extends BaseEntity {
  FIELD_NAMES!:
    | "id"
    | "noteGuid"
    | "comment"
    | "profit"
    | BaseEntity["FIELD_NAMES2"];

  static readonly params: EntityParams<ProfitLogEntity> = {
    name: "profitLog",
    primaryKey: "id",
    displayField: "comment",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 2000,
    },
    append: {},
    columns: {
      id: {
        type: "integer",
        primary: true,
        generated: true,
        nullable: false,
      },
      noteGuid: {
        type: "string",
        nullable: false,
      },
      comment: {
        type: "text",
        nullable: true,
      },
      profit: {
        type: "integer",
        nullable: false,
      },
    },
  };

  id!: number;
  noteGuid!: string;
  comment!: string | null;
  profit!: number;
}
