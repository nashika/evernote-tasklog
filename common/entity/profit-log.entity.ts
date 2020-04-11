import { BaseEntity, IBaseEntityParams } from "./base.entity";

export class ProfitLogEntity extends BaseEntity {
  static params: IBaseEntityParams<ProfitLogEntity> = {
    name: "profitLog",
    primaryKey: "id",
    displayField: "comment",
    archive: false,
    default: {
      where: {},
      order: [["updatedAt", "DESC"]],
      limit: 2000,
    },
    append: {
      where: {},
      order: [],
    },
  };

  id?: number;
  noteGuid?: string;
  comment?: string;
  profit?: number;
}
