import BaseEntity, { EntityParams } from "./base.entity";

export default class ConstraintResultEntity extends BaseEntity {
  FIELD_NAMES!: "id" | "noteGuid" | "constraintId" | BaseEntity["FIELD_NAMES2"];

  static readonly params: EntityParams<ConstraintResultEntity> = {
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
        nullable: false,
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

  id!: number;
  noteGuid!: string;
  constraintId!: number;
}
