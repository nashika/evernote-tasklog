import {getLogger} from "log4js";
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {SettingService} from "./setting.service";
import {EvernoteClientService} from "./evernote-client.service";
import {UserTable} from "../table/user.table";
import {UserEntity} from "../../common/entity/user.entity";
import {MyPromise} from "../../common/util/my-promise";
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

  initializeGlobal(): Promise<void> {
    return Promise.resolve().then(() => {
      return this.tableService.initializeGlobal();
    }).then(() => {
      return this.tableService.getGlobalTable<GlobalUserTable>(GlobalUserEntity).find();
    }).then(globalUsers => {
      return MyPromise.eachSeries(globalUsers, globalUser => {
        return this.initializeUser(globalUser);
      });
    });
  }

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    return Promise.resolve().then(() => {
      return this.evernoteClientService.initializeUser(globalUser);
    }).then(() => {
      return this.tableService.initializeUser(globalUser);
    }).then(() => {
      return this.settingService.initializeUser(globalUser);
    }).then(() => {
      return this.syncService.initializeUser(globalUser);
    }).then(() => {
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).loadRemote()
    }).then((remoteUser: UserEntity) => {
      return this.tableService.getUserTable<UserTable>(UserEntity, globalUser).save(remoteUser);
    }).then(() => {
      return this.syncService.sync(globalUser, true);
    }).then(() => {
      logger.info(`Init user finished. user:${globalUser._id} data was initialized.`);
    });
  }

}
