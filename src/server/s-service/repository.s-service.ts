import path from "path";
import { injectable } from "inversify";
import { Connection, createConnection, getCustomRepository } from "typeorm";

import BaseSService from "./base.s-service";
import container from "~/src/server/inversify.config";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";
import BaseRepository from "~/src/server/repository/base.repository";
import AttendanceRepository from "~/src/server/repository/attendance.repository";
import BaseEntity from "~/src/common/entity/base.entity";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

@injectable()
export default class RepositorySService extends BaseSService {
  caches: {
    tags: { [guid: string]: TagEntity };
    notebooks: { [guid: string]: NotebookEntity };
  };

  private connection: Connection | null = null;
  private readonly repositories: {
    [tableName: string]: BaseRepository<BaseEntity>;
  };

  constructor() {
    super();
    this.caches = {
      tags: {},
      notebooks: {},
    };
    this.repositories = {};
  }

  get attendanceRepository(): AttendanceRepository {
    return this.getRepository(AttendanceEntity);
  }

  /*
  get constraintResultTable(): ConstraintResultTable {
    return this.getTable<ConstraintResultTable>(ConstraintResultEntity);
  }

  get linkedNotebookTable(): LinkedNotebookTable {
    return this.getTable<LinkedNotebookTable>(LinkedNotebookEntity);
  }

  get noteTable(): NoteTable {
    return this.getTable<NoteTable>(NoteEntity);
  }

  get notebookTable(): NotebookTable {
    return this.getTable<NotebookTable>(NotebookEntity);
  }

  get optionTable(): OptionTable {
    return this.getTable<OptionTable>(OptionEntity);
  }

  get profitLogTable(): ProfitLogTable {
    return this.getTable<ProfitLogTable>(ProfitLogEntity);
  }

  get savedSearchTable(): SavedSearchTable {
    return this.getTable<SavedSearchTable>(SavedSearchEntity);
  }

  get tagTable(): TagTable {
    return this.getTable<TagTable>(TagEntity);
  }

  get timeLogTable(): TimeLogTable {
    return this.getTable<TimeLogTable>(TimeLogEntity);
  }
   */

  async initialize(): Promise<void> {
    await this.getConnection();
    for (const RepositoryClass of container.getAll<any>(BaseRepository)) {
      const repository: BaseRepository<BaseEntity> = getCustomRepository(
        RepositoryClass
      );
      this.repositories[repository.EntityClass.params.name] = repository;
      await repository.initialize();
    }
    // await this.reloadCache();
  }

  // eslint-disable-next-line require-await
  async getConnection(): Promise<Connection> {
    if (!this.connection) {
      return this.initConnection();
    }
    return this.connection;
  }

  async initConnection(): Promise<Connection> {
    const filePath = path.join(__dirname, "../../../db/database.db");
    this.connection = await createConnection({
      type: "sqlite",
      database: filePath,
      entities: [AttendanceSEntity],
      logging: true,
    });
    return this.connection;
  }

  getRepository<T extends BaseRepository<BaseEntity>>(
    EntityClass: typeof BaseEntity
  ): T {
    return <T>this.repositories[EntityClass.params.name];
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
