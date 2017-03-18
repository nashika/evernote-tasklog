import * as path from "path";

import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseServerService} from "./base-server.service";
import {BaseTable} from "../table/base.table";
import {BaseEntity} from "../../common/entity/base.entity";
import {SessionService} from "./session.service";
import {container} from "../inversify.config";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

@injectable()
export class TableService extends BaseServerService {

  private databases: {[fileName: string]: sequelize.Sequelize};
  private globalTables: {[tableName: string]: BaseTable<BaseEntity>};
  private userTables: {[userName: string]: {[tableName: string]: BaseTable<BaseEntity>}};

  constructor(protected sessionService: SessionService) {
    super();
    this.databases = {};
    this.globalTables = {};
    this.userTables = {};
  }

  async initializeGlobal(): Promise<void> {
    let database = this.getDatabase("_global");
    for (let table of container.getAll<BaseTable<BaseEntity>>(BaseTable)) {
      if (table.EntityClass.params.requireUser) continue;
      this.globalTables[table.EntityClass.params.name] = table;
      table.initialize(database);
    }
    await database.sync();
  }

  async initializeUser(globalUser: GlobalUserEntity): Promise<void> {
    if (this.userTables[globalUser.id]) return;
    this.userTables[globalUser.id] = {};
    let database = this.getDatabase(globalUser.username);
    for (let table of container.getAll<BaseTable<BaseEntity>>(BaseTable)) {
      if (!table.EntityClass.params.requireUser) continue;
      this.userTables[globalUser.id][table.EntityClass.params.name] = table;
      table.initialize(this.getDatabase(globalUser.username), globalUser);
    }
    await database.sync();
  }

  private getDatabase(fileName: string): sequelize.Sequelize {
    if (this.databases[fileName]) return this.databases[fileName];
    let filePath = path.join(__dirname, "../../../db/", fileName + ".db");
    return this.databases[fileName] = new sequelize("", "", null, {
      dialect: "sqlite",
      storage: filePath,
      logging: false
    });
  }


  getGlobalTable<T extends BaseTable<BaseEntity>>(EntityClass: typeof BaseEntity): T {
    return <T>this.globalTables[EntityClass.params.name];
  }

  getUserTable<T extends BaseTable<BaseEntity>>(EntityClass: typeof BaseEntity, globalUser: GlobalUserEntity): T {
    return <T>this.userTables[globalUser.id][EntityClass.params.name];
  }

}
