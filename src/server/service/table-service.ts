import _ = require("lodash");
import {injectable} from "inversify";
import {Request} from "express";

import {BaseServerService} from "./base-server-service";
import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {SessionService} from "./session-service";
import {SettingTable} from "../table/setting-table";
import {kernel} from "../inversify.config";
import {GlobalUserTable} from "../table/global-user-table";

@injectable()
export class TableService extends BaseServerService {

  private globalTables: {[tableName: string]: BaseTable};
  private userTables: {[userName: string]: {[tableName: string]: BaseTable}};

  constructor(protected sessionService: SessionService) {
    super();
    this.globalTables = {};
    this.userTables = {};
  }

  initializeGlobal() {
    this.globalTables["setting"] = <SettingTable>kernel.getNamed<BaseTable>(BaseTable, "setting");
    this.globalTables["setting"].connect();
    this.globalTables["globalUser"] = <GlobalUserTable>kernel.getNamed<BaseTable>(BaseTable, "globalUser");
    this.globalTables["globalUser"].connect();
  }

  initializeUser(username: string) {
    this.userTables[username] = {};
    for (let table of kernel.getAll<BaseTable>(BaseTable)) {
      this.userTables[username][table.EntityClass.params.name] = table;
      table.connect(username);
    }
  }

  getGlobalTable<T extends BaseTable>(EntityClass: typeof BaseEntity): T {
    return <T>this.globalTables[EntityClass.params.name];
  }

  getUserTable<T extends BaseTable>(EntityClass: typeof BaseEntity, username: string): T;
  getUserTable<T extends BaseTable>(EntityClass: typeof BaseEntity, req: Request): T;
  getUserTable<T extends BaseTable>(EntityClass: typeof BaseEntity, arg: string|Request): T {
    let username: string;
    if (_.isString(arg)) {
      username = arg;
    } else if (_.isObject(arg)) {
      username = this.sessionService.get(arg).user.username;
    } else {
      throw new Error();
    }
    return <T>this.userTables[username][EntityClass.params.name];
  }

}
