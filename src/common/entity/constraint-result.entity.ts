import BaseEntity, { IBaseEntityParams } from "./base.entity";

export default class ConstraintResultEntity extends BaseEntity {
  static params: IBaseEntityParams<ConstraintResultEntity> = {
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
