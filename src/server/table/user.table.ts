import {injectable} from "inversify";
import sequelize = require("sequelize");

import {UserEntity} from "../../common/entity/user.entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote.table";
import {EvernoteClientService} from "../service/evernote-client.service";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class UserTable extends BaseSingleEvernoteTable<UserEntity> {

  protected fields: sequelize.DefineAttributes = {
    username: {type: sequelize.STRING, allowNull: false},
    email: {type: sequelize.STRING, allowNull: true},
    name: {type: sequelize.STRING, allowNull: true},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<UserEntity>> = {
    indexes: [],
  };

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async loadRemote(): Promise<UserEntity> {
    return await this.evernoteClientService.getUser(this.globalUser);
  }

}
