import {BaseSingleEvernoteEntity} from "./base-single-evernote.entity";
import {IBaseSingleEntityParams} from "./base-single.entity";

export class UserEntity extends BaseSingleEvernoteEntity {

  static params:IBaseSingleEntityParams = {
    name: "user",
    primaryKey: "id",
    displayField: "username",
    requireUser: true,
    archive: false,
    defaultDoc: {},
  };

  username: string;
  shardId: string;

}
