import {injectable} from "inversify";

import {UserEntity} from "../../common/entity/user.entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote.table";
import {EvernoteClientService} from "../service/evernote-client.service";

@injectable()
export class UserTable extends BaseSingleEvernoteTable<UserEntity> {

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  loadRemote(): Promise<UserEntity> {
    return this.evernoteClientService.getUser(this.globalUser);
  }

}
