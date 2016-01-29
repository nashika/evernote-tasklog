import MultiEntity from "./multi-entity";

export default class ProfitLogEntity implements MultiEntity {
    noteGuid:string;
    comment:string;
    profit:number;
}
