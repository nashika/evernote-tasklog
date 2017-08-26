import {BaseEntity, IBaseEntityParams} from "./base.entity";

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

  id: number;
  noteGuid: string;
  comment: string;
  allDay: boolean;
  date: number;
  personId: number;
  spentTime: number;

}
