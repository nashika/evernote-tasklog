import {injectable} from "inversify";
import sequelize = require("sequelize");

import {SyncStateEntity} from "../../common/entity/sync-state.entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote.table";
import {EvernoteClientService} from "../service/evernote-client.service";
import {IBaseTableParams} from "./base.table";

@injectable()
export class SyncStateTable extends BaseSingleEvernoteTable<SyncStateEntity> {

  static params: IBaseTableParams = {
    fields: {
      updateCount: {type: sequelize.INTEGER, allowNull: false},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async loadRemote(): Promise<SyncStateEntity> {
    return await this.evernoteClientService.getSyncState(this.globalUser);
  }

}
