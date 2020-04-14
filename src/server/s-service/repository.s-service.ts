import path from "path";
import { injectable } from "inversify";
import { Connection, createConnection, getCustomRepository } from "typeorm";

/*
import { NoteTable } from "../table/note.table";
import { OptionTable } from "../table/option.table";
import { BaseTable } from "../table/base.table";
import { ConstraintResultTable } from "../table/constraint-result.table";
import { NotebookTable } from "../table/notebook.table";
import { LinkedNotebookEntity } from "../../common/entity/linked-notebook.entity";
import { LinkedNotebookTable } from "../table/linked-notebook.table";
import { TagTable } from "../table/tag.table";
import { SavedSearchTable } from "../table/saved-search.table";
import { TimeLogTable } from "../table/time-log.table";
import { ProfitLogTable } from "../table/profit-log.table";
import { BaseEntity } from "~/common/entity/base.entity";
 */

import BaseSService from "./base.s-service";
import container from "~/src/server/inversify.config";
import NotebookCEntity from "~/src/common/c-entity/notebook.c-entity";
import TagCEntity from "~/src/common/c-entity/tag.c-entity";
import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";
import BaseRepository from "~/src/server/repository/base.repository";
import AttendanceRepository from "~/src/server/repository/attendance.repository";
import BaseCEntity from "~/src/common/c-entity/base.c-entity";
import AttendanceCEntity from "~/src/common/c-entity/attendance.c-entity";

@injectable()
export default class RepositorySService extends BaseSService {
  caches: {
    tags: { [guid: string]: TagCEntity };
    notebooks: { [guid: string]: NotebookCEntity };
  };

  private connection: Connection | null = null;
  private readonly repositories: {
    [tableName: string]: BaseRepository<BaseCEntity>;
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
    return this.getRepository(AttendanceCEntity);
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
      const repository: BaseRepository<BaseCEntity> = getCustomRepository(
        RepositoryClass
      );
      this.repositories[repository.CEntityClass.params.name] = repository;
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

  getRepository<T extends BaseRepository<BaseCEntity>>(
    CEntityClass: typeof BaseCEntity
  ): T {
    return <T>this.repositories[CEntityClass.params.name];
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
