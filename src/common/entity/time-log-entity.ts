import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi-entity";

export class TimeLogEntity extends BaseMultiEntity {

  static params:IBaseMultiEntityParams = {
    name: "timeLog",
    titleField: "comment",
    requireUser: true,
    default: {
      query: {},
      sort: {updated: -1},
      limit: 2000,
    },
    append: {
      query: {},
      sort: {},
    },
  };

  noteGuid: string;
  comment: string;
  allDay: boolean;
  date: number;
  person: string;
  spentTime: number;

}
