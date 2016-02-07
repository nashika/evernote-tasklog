import {MultiEntity} from "./multi-entity";

export class ProfitLogEntity implements MultiEntity {
    noteGuid:string;
    comment:string;
    profit:number;
}
