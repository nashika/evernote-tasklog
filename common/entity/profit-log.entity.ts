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

  id: number | null = null;
  noteGuid: string | null = null;
  comment: string | null = null;
  profit: number | null = null;
}
