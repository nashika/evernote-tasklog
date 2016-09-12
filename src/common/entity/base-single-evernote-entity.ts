import {BaseSingleEntity} from "./base-single-entity";

export abstract class BaseSingleEvernoteEntity<T> extends BaseSingleEntity {

  constructor(data: T) {
    super(data);
  }

}
