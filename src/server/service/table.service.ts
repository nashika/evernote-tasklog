import * as path from "path";

import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseServerService} from "./base-server.service";
import {BaseTable} from "../table/base.table";
import {BaseEntity} from "../../common/entity/base.entity";
import {container} from "../inversify.config";
import {configLoader} from "../../common/util/config-loader";

@injectable()
export class TableService extends BaseServerService {

  private database: sequelize.Sequelize;
  private tables: {[tableName: string]: BaseTable<BaseEntity>};

  async initialize(): Promise<void> {
    let filePath = path.join(__dirname, "../../../db/", configLoader.app.dbName + ".db");
    this.database = new sequelize("", "", null, {
      dialect: "sqlite",
      storage: filePath,
      logging: false
    });
    this.tables = {};
    for (let table of container.getAll<BaseTable<BaseEntity>>(BaseTable)) {
      this.tables[table.EntityClass.params.name] = table;
      table.initialize(this.database);
    }
    await this.database.sync();
  }

  getTable<T extends BaseTable<BaseEntity>>(EntityClass: typeof BaseEntity): T {
    return <T>this.tables[EntityClass.params.name];
  }

}
