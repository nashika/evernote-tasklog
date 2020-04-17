import BaseEntity, { IEntityParams } from "./base.entity";

export default class ConstraintResultEntity extends BaseEntity {
  static readonly params: IEntityParams<ConstraintResultEntity> = {
    name: "constraintResult",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
    columns: {
      id: {
        type: "integer",
        primary: true,
        generated: true,
      },
      noteGuid: {
        type: "string",
        nullable: false,
      },
      constraintId: {
        type: "integer",
        nullable: false,
      },
    },
  };

  id?: number;
  noteGuid?: string;
  constraintId?: number;
}
