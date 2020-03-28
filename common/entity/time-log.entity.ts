import { BaseEntity, IBaseEntityParams } from "./base.entity";

export class TimeLogEntity extends BaseEntity {
  static params: IBaseEntityParams<TimeLogEntity> = {
    name: "timeLog",
    primaryKey: "id",
    displayField: "comment",
    archive: false,
    default: {
      where: {},
      order: [["updatedAt", "DESC"]],
      limit: 2000,
    },
    append: {
      where: {},
      order: [],
    },
  };

  id: number | null = null;
  noteGuid: string | null = null;
  comment: string | null = null;
  allDay: boolean | null = null;
  date: number | null = null;
  personId: number | null = null;
  spentTime: number | null = null;
}
