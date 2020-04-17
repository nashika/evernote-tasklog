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
  };

  id?: number;
  noteGuid?: string;
  comment?: string;
  profit?: number;
}
