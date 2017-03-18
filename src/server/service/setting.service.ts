import {injectable} from "inversify";

import {BaseServerService} from "./base-server.service";
import {TableService} from "./table.service";
import {SettingTable} from "../table/setting.table";
import {SettingEntity} from "../../common/entity/setting.entity";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

export interface IUserSetting {
  persons: Array<{name: string}>;
  [key: string]: any;
}

@injectable()
export class SettingService extends BaseServerService {

  private userSettings: {[username: string]: IUserSetting};

  constructor(protected tableService: TableService) {
    super();
    this.userSettings = {};
  }

  async initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    if (this.userSettings[globalUser.id]) return;
    this.userSettings[globalUser.id] = <any>{};
    let settingEntities = await this.tableService.getUserTable<SettingTable>(SettingEntity, globalUser).findAll();
    for (let settingEntity of settingEntities)
      this.userSettings[globalUser.id][settingEntity.key] = settingEntity.value;
  }

  getUser(globalUser: GlobalUserEntity): IUserSetting {
    return this.userSettings[globalUser.id];
  }

}
