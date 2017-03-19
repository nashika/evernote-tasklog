import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class ProfitLogEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "profitLog",
    primaryKey: "id",
    displayField: "comment",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [["updated", "DESC"]],
      limit: 2000,
    },
    append: {
      where: {},
      order: [],
    },
  };

  id: number;
  noteGuid: string;
  comment: string;
  profit: number;

}
