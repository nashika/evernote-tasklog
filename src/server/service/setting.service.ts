import {injectable} from "inversify";

import {BaseServerService} from "./base-server.service";
import {TableService} from "./table.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {OptionTable} from "../table/option.table";
import {OptionEntity} from "../../common/entity/option.entity";

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
    this.userSettings[globalUser.key] = <any>{};
    let optionEntities = await this.tableService.getUserTable<OptionTable>(OptionEntity, globalUser).findAll({
      where: {key: {$like: "settings.%"}}
    });
    for (let optionEntity of optionEntities)
      this.userSettings[globalUser.key][optionEntity.key.replace("settings.", "")] = optionEntity.value;
  }

  getUser(globalUser: GlobalUserEntity): IUserSetting {
    return this.userSettings[globalUser.key];
  }

}
