import { BaseEntity, IBaseEntityParams } from "./base.entity";

export class ConstraintResultEntity extends BaseEntity {
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

  id: number | null = null;
  noteGuid: string | null = null;
  constraintId: number | null = null;
}
