import {BaseMultiEntity} from "./base-multi.entity";

export abstract class BaseMultiEvernoteEntity extends BaseMultiEntity {

  guid: string;
  updateSequenceNum: number;

}
