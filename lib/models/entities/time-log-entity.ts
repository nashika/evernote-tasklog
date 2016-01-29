import MultiEntity from "./multi-entity";

export default class TimeLogEntity implements MultiEntity {
    noteGuid:string;
    comment:string;
    allDay:boolean;
    date:number;
    person:string;
    spentTime:number;
}
