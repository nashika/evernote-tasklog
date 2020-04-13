import BaseCEntity, { IBaseCEntityParams } from "./base.c-entity";

export default class TimeLogCEntity extends BaseCEntity {
  static params: IBaseCEntityParams<TimeLogCEntity> = {
    name: "timeLog",
    primaryKey: "id",
    displayField: "comment",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 2000,
    },
    append: {},
  };

  id?: number;
  noteGuid?: string;
  comment?: string;
  allDay?: boolean;
  date?: number;
  personId?: number;
  spentTime?: number;
}
