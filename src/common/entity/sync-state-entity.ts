import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IBaseSingleEntityParams} from "./base-single-entity";

export class SyncStateEntity extends BaseSingleEvernoteEntity {

  static params:IBaseSingleEntityParams = {
    name: "syncState",
    titleField: "name",
    requireUser: true,
    defaultDoc: {updateCount: 0},
  };

  updateCount: number;
  lastChecked: number;
  nextInterval: number;

}
