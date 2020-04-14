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
import { INVERSIFY_TYPES } from "~/src/common/inversify.symbol";

@injectable()
export default class RepositorySService extends BaseSService {
  caches: {
    tags: { [guid: string]: TagEntity };
    notebooks: { [guid: string]: NotebookEntity };
  };

  private connection: Connection | null = null;
  private readonly repositories: {
    [tableName: string]: Repository<BaseEntity>;
  };

  constructor() {
    super();
    this.caches = {
      tags: {},
      notebooks: {},
    };
    this.repositories = {};
  }

  async initialize(): Promise<void> {
    await this.getConnection();
    for (const schema of container.getAll<EntitySchema<BaseEntity>>(
      INVERSIFY_TYPES.Schema
    )) {
      const repository = getRepository(schema);
      this.repositories[schema.options.name] = repository;
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
    const schemas = container.getAll<EntitySchema>(INVERSIFY_TYPES.Schema);
    this.connection = await createConnection({
      type: "sqlite",
      database: filePath,
      entities: schemas,
      logging: true,
    });
    return this.connection;
  }

  getRepository<T extends BaseEntity>(
    EntityClass: typeof BaseEntity
  ): Repository<T> {
    return <Repository<T>>this.repositories[EntityClass.params.name];
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
