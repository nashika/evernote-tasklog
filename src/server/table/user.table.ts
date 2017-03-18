import {injectable} from "inversify";
import sequelize = require("sequelize");

import {UserEntity} from "../../common/entity/user.entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote.table";
import {EvernoteClientService} from "../service/evernote-client.service";
import {IBaseTableParams} from "./base.table";

@injectable()
export class UserTable extends BaseSingleEvernoteTable<UserEntity> {

  static params: IBaseTableParams = {
    fields: {
      username: {type: sequelize.STRING, allowNull: false},
      email: {type: sequelize.STRING, allowNull: true},
      name: {type: sequelize.STRING, allowNull: true},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async loadRemote(): Promise<UserEntity> {
    return await this.evernoteClientService.getUser(this.globalUser);
  }

}
