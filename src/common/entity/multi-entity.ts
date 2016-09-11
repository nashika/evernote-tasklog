import {Entity} from "./entity";

export interface MultiEntity extends Entity {
    guid?:string;
    updateSequenceNum?:number;
}
