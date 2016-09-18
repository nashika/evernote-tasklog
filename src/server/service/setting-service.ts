import {injectable} from "inversify";

import {BaseServerService} from "./base-server-service";
import {TableService} from "./table-service";
import {SettingTable} from "../table/setting-table";
import {SettingEntity} from "../../common/entity/setting-entity";

export interface IGlobalSetting {
  "token.production": string;
  "token.sandbox": string;
  [key: string]: any;
}

export interface IUserSetting {
  persons: Array<{name: string}>;
  [key: string]: any;
}

@injectable()
export class SettingService extends BaseServerService {

  private globalSettings: IGlobalSetting;
  private userSettings: {[username: string]: IUserSetting};

  constructor(protected tableService: TableService) {
    super();
    this.userSettings = {};
  }

  initializeGlobal(): Promise<void> {
    return this.tableService.getGlobalTable<SettingTable>(SettingEntity).find().then(settings => {
      let results: IGlobalSetting = <any>{};
      for (let setting of settings) results[setting._id] = setting;
      this.globalSettings = results;
    });
  }

  initializeUser(username: string): Promise<void> {
    return this.tableService.getUserTable<SettingTable>(SettingEntity, username).find().then((settings: SettingEntity[]) => {
      this.userSettings[username] = <any>{};
      for (let setting of settings)
        this.userSettings[username][setting._id] = setting.value;
    });
  }

  getGlobal(): IGlobalSetting {
    return this.globalSettings;
  }

  getUser(username: string): IUserSetting {
    return this.userSettings[username];
  }

}
