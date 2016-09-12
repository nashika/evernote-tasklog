import {BaseMultiEntity} from "./base-multi-entity";
import {IEntityParams} from "./base-entity";

export class TimeLogEntity extends BaseMultiEntity {

  static params:IEntityParams = {
    name: "timeLog",
  };

  noteGuid: string;
  comment: string;
  allDay: boolean;
  date: number;
  person: string;
  spentTime: number;

}
