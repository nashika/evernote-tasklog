import BaseEntity from "./base.entity";

export default abstract class BaseEvernoteEntity extends BaseEntity {
  guid?: string;
  updateSequenceNum?: number;
}
