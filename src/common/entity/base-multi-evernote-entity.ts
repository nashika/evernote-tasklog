import {BaseMultiEntity} from "./base-multi-entity";

export abstract class BaseMultiEvernoteEntity<T> extends BaseMultiEntity {

  guid: string;
  updateSequenceNum: number;

}
