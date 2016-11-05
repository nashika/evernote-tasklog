import {injectable} from "inversify";

import {BaseServerService} from "./base-server-service";
import {BaseTable} from "../table/base-table";
import {BaseEntity} from "../../common/entity/base-entity";
import {SessionService} from "./session-service";
import {kernel} from "../inversify.config";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

@injectable()
export class TableService extends BaseServerService {

  private globalTables: {[tableName: string]: BaseTable};
  private userTables: {[userName: string]: {[tableName: string]: BaseTable}};

  constructor(protected sessionService: SessionService) {
    super();
    this.globalTables = {};
    this.userTables = {};
  }

  initializeGlobal(): Promise<void> {
    for (let table of kernel.getAll<BaseTable>(BaseTable)) {
      if (table.EntityClass.params.requireUser) continue;
      this.globalTables[table.EntityClass.params.name] = table;
      table.connect();
    }
    return Promise.resolve();
  }

  initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    this.userTables[globalUser._id] = {};
    for (let table of kernel.getAll<BaseTable>(BaseTable)) {
      if (!table.EntityClass.params.requireUser) continue;
      this.userTables[globalUser._id][table.EntityClass.params.name] = table;
      table.connect(globalUser);
    }
    return Promise.resolve();
  }

  getGlobalTable<T extends BaseTable>(EntityClass: typeof BaseEntity): T {
    return <T>this.globalTables[EntityClass.params.name];
  }

  getUserTable<T extends BaseTable>(EntityClass: typeof BaseEntity, globalUser: GlobalUserEntity): T {
    return <T>this.userTables[globalUser._id][EntityClass.params.name];
  }

}
