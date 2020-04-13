import BaseCEntity, { IBaseCEntityParams } from "./base.c-entity";

export default class ProfitLogCEntity extends BaseCEntity {
  static params: IBaseCEntityParams<ProfitLogCEntity> = {
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
