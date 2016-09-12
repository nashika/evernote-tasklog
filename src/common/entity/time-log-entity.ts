import {BaseMultiEntity} from "./base-multi-entity";

export class TimeLogEntity extends BaseMultiEntity {

  noteGuid: string;
  comment: string;
  allDay: boolean;
  date: number;
  person: string;
  spentTime: number;

}
