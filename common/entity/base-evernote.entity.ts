import { BaseEntity } from "./base.entity";

export abstract class BaseEvernoteEntity extends BaseEntity {
  guid: string | null = null;
  updateSequenceNum: number | null = null;
}
