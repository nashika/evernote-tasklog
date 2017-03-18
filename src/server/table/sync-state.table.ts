import {injectable} from "inversify";
import sequelize = require("sequelize");

import {SyncStateEntity} from "../../common/entity/sync-state.entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote.table";
import {EvernoteClientService} from "../service/evernote-client.service";
import {ISequelizeInstance} from "./base.table";

@injectable()
export class SyncStateTable extends BaseSingleEvernoteTable<SyncStateEntity> {

  protected fields: sequelize.DefineAttributes = {
    updateCount: {type: sequelize.INTEGER, allowNull: false},
  };

  protected options: sequelize.DefineOptions<ISequelizeInstance<SyncStateEntity>> = {
    indexes: [],
  };

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async loadRemote(): Promise<SyncStateEntity> {
    return await this.evernoteClientService.getSyncState(this.globalUser);
  }

}
