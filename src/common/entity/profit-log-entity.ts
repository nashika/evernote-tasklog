import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi-entity";

export class ProfitLogEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "profitLog",
    titleField: "comment",
    requireUser: true,
    archive: false,
    default: {
      query: {},
      sort: {updated: -1},
      limit: 2000,
    },
    append: {
      query: {},
      sort: {},
    },
  };

  noteGuid: string;
  comment: string;
  profit: number;

}
