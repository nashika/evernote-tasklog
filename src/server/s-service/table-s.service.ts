import path from "path";
import { injectable } from "inversify";
import {
  Connection,
  createConnection,
  EntitySchema,
  getRepository,
  Repository,
} from "typeorm";

import BaseSService from "./base.s-service";
import container from "~/src/server/inversify.config";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import BaseEntity from "~/src/common/entity/base.entity";
import { SYMBOL_TYPES } from "~/src/common/symbols";
import BaseTable from "~/src/server/table/base.table";

@injectable()
export default class TableSService extends BaseSService {
  caches: {
    tags: { [guid: string]: TagEntity };
    notebooks: { [guid: string]: NotebookEntity };
  };

  private connection: Connection | null = null;
  private readonly tables: {
    [name: string]: BaseTable<BaseEntity>;
  };

  constructor() {
    super();
    this.caches = {
      tags: {},
      notebooks: {},
    };
    this.tables = {};
  }

  async initialize(): Promise<void> {
    const connection = await this.getConnection();
    for (const table of container.getAll<BaseTable<BaseEntity>>(
      SYMBOL_TYPES.Table
    )) {
      await table.initialize(connection);
      this.tables[table.EntityClass.params.name] = table;
    }
    // await this.reloadCache();
  }

  private async getConnection(): Promise<Connection> {
    if (!this.connection) {
      return this.initConnection();
    }
    return this.connection;
  }

  private async initConnection(): Promise<Connection> {
    const filePath = path.join(__dirname, "../../../db/database.db");
    const tables = container.getAll<BaseTable<BaseEntity>>(SYMBOL_TYPES.Table);
    const schemas = tables.map(table => table.schema);
    this.connection = await createConnection({
      type: "sqlite",
      database: filePath,
      entities: schemas,
      logging: true,
    });
    return this.connection;
  }

  getTable<T extends BaseEntity>(EntityClass: typeof BaseEntity): BaseTable<T> {
    return <BaseTable<T>>this.tables[EntityClass.params.name];
  }

  /*
  async reloadCache(type: "tag" | "notebook" | "all" = "all"): Promise<void> {
    if (type === "tag" || type === "all")
      this.caches.tags = _.keyBy(await this.tagTable.findAll(), "guid");
    if (type === "notebook" || type === "all")
      this.caches.notebooks = _.keyBy(
        await this.notebookTable.findAll(),
        "guid"
      );
  }
   */

  async sync(): Promise<void> {
    const connection = await this.getConnection();
    await connection.synchronize();
  }
}
