import BaseEntity, { IEntityParams } from "./base.entity";

export default class TimeLogEntity extends BaseEntity {
  static readonly params: IEntityParams<TimeLogEntity> = {
    name: "timeLog",
    primaryKey: "id",
    displayField: "comment",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 2000,
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
      comment: {
        type: "text",
        nullable: true,
      },
      allDay: {
        type: "boolean",
        nullable: false,
      },
      date: {
        type: "integer",
        nullable: false,
      },
      personId: {
        type: "integer",
        nullable: false,
      },
      spentTime: {
        type: "integer",
        nullable: true,
      },
    },
  };

  id?: number;
  noteGuid?: string;
  comment?: string;
  allDay?: boolean;
  date?: number;
  personId?: number;
  spentTime?: number;
}
