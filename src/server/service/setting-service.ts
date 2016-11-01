import {injectable} from "inversify";

import {BaseServerService} from "./base-server-service";
import {TableService} from "./table-service";
import {SettingTable} from "../table/setting-table";
import {SettingEntity} from "../../common/entity/setting-entity";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

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

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    return this.tableService.getUserTable<SettingTable>(SettingEntity, globalUser).find().then((settings: SettingEntity[]) => {
      this.userSettings[globalUser._id] = <any>{};
      for (let setting of settings)
        this.userSettings[globalUser._id][setting._id] = setting.value;
    });
  }

  getUser(globalUser: GlobalUserEntity): IUserSetting {
    return this.userSettings[globalUser._id];
  }

}
