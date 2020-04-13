import BaseCEntity, { IBaseCEntityParams } from "./base.c-entity";

export default class ConstraintResultCEntity extends BaseCEntity {
  static params: IBaseCEntityParams<ConstraintResultCEntity> = {
    name: "constraintResult",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
  };

  id?: number;
  noteGuid?: string;
  constraintId?: number;
}
