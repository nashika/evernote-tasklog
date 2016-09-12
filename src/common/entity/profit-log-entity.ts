import {BaseMultiEntity} from "./base-multi-entity";
import {IEntityParams} from "./base-entity";

export class ProfitLogEntity extends BaseMultiEntity {

  static params:IEntityParams = {
    name: "profitLog",
  };

  noteGuid: string;
  comment: string;
  profit: number;

}
