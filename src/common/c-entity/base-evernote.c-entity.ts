import BaseCEntity from "./base.c-entity";

export default abstract class BaseEvernoteCEntity extends BaseCEntity {
  guid?: string;
  updateSequenceNum?: number;
}
