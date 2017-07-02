import {BaseEntity} from "./base.entity";

export abstract class BaseEvernoteEntity extends BaseEntity {

  guid: string;
  updateSequenceNum: number;

}
