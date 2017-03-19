import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class TimeLogEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "timeLog",
    primaryKey: "id",
    displayField: "comment",
    requireUser: true,
    archive: false,
    default: {
      where: {},
      order: [["updated", "DESC"]],
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
  person: string;
  spentTime: number;

}
