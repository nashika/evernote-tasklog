import {MultiEntity} from "./multi-entity";

export class ProfitLogEntity implements MultiEntity {
  _id: string;
  noteGuid: string;
  comment: string;
  profit: number;
}
