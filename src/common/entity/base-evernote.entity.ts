import BaseEntity from "./base.entity";

export default abstract class BaseEvernoteEntity extends BaseEntity {
  FIELD_NAMES3!: "guid" | "updateSequenceNum" | BaseEntity["FIELD_NAMES2"];

  guid!: string;
  updateSequenceNum!: number;
}

type keys = keyof BaseEvernoteEntity;
