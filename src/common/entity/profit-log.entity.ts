import BaseEntity, { IEntityParams } from "./base.entity";

export default class ProfitLogEntity extends BaseEntity {
  static readonly params: IEntityParams<ProfitLogEntity> = {
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
