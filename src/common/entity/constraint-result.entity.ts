import BaseEntity, { IBaseEntityParams } from "~/src/common/entity/base.entity";

export default class ConstraintResultEntity extends BaseEntity {
  static params: IBaseEntityParams<ConstraintResultEntity> = {
    name: "constraintResult",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      where: {},
      order: [],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  id?: number;
  noteGuid?: string;
  constraintId?: number;
}
