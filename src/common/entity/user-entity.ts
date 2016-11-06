import {BaseSingleEvernoteEntity} from "./base-single-evernote-entity";
import {IBaseSingleEntityParams} from "./base-single-entity";

export class UserEntity extends BaseSingleEvernoteEntity {

  static params:IBaseSingleEntityParams = {
    name: "user",
    titleField: "name",
    requireUser: true,
    archive: false,
    defaultDoc: {},
  };

  id: number;
  username: string;
  shardId: string;

}
