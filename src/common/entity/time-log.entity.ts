import BaseEntity, { IBaseEntityParams } from "./base.entity";

export default class TimeLogEntity extends BaseEntity {
  static params: IBaseEntityParams<TimeLogEntity> = {
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