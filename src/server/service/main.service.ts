import {getLogger} from "log4js";
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {SettingService} from "./setting.service";
import {EvernoteClientService} from "./evernote-client.service";
import {UserTable} from "../table/user.table";
import {UserEntity} from "../../common/entity/user.entity";
import {BaseServerService} from "./base-server.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {GlobalUserTable} from "../table/global-user.table";
import {SyncService} from "./sync.service";

let logger = getLogger("system");

@injectable()
export class MainService extends BaseServerService {

  constructor(protected tableService: TableService,
              protected settingService: SettingService,
              protected syncService: SyncService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async initializeGlobal(): Promise<void> {
    await this.tableService.initializeGlobal();
    let globalUsers = await this.tableService.getGlobalTable<GlobalUserTable>(GlobalUserEntity).findAll();
    for (let globalUser of globalUsers) {
      await this.initializeUser(globalUser);
    }
  }

  async initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    await this.evernoteClientService.initializeUser(globalUser);
    await this.tableService.initializeUser(globalUser);
    await this.settingService.initializeUser(globalUser);
    await this.syncService.initializeUser(globalUser);
    let remoteUser = await this.tableService.getUserTable<UserTable>(UserEntity, globalUser).loadRemote()
    await this.tableService.getUserTable<UserTable>(UserEntity, globalUser).save(remoteUser);
    await this.syncService.sync(globalUser, true);
    logger.info(`Init user finished. user:${globalUser.key} data was initialized.`);
  }

}
