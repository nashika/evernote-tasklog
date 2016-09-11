import {MultiEntity} from "./multi-entity";

export class TimeLogEntity implements MultiEntity {
    _id:string;
    noteGuid:string;
    comment:string;
    allDay:boolean;
    date:number;
    person:string;
    spentTime:number;
}
