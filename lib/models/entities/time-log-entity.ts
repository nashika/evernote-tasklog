import {MultiEntity} from "./multi-entity";

export class TimeLogEntity implements MultiEntity {
    noteGuid:string;
    comment:string;
    allDay:boolean;
    date:number;
    person:string;
    spentTime:number;
}
