import path from "path";
import _ from "lodash";
import { injectable } from "inversify";
import { Connection, createConnection, EntitySchema } from "typeorm";

import BaseSService from "./base.s-service";
import container from "~/src/server/inversify.config";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import BaseEntity from "~/src/common/entity/base.entity";
import { SYMBOL_TYPES } from "~/src/common/symbols";
import BaseTable from "~/src/server/table/base.table";
import ConstraintResultTable from "~/src/server/table/constraint-result.table";
import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import LinkedNotebookTable from "~/src/server/table/linked-notebook.table";
import LinkedNotebookEntity from "~/src/common/entity/linked-notebook.entity";
import NoteTable from "~/src/server/table/note.table";
import NoteEntity from "~/src/common/entity/note.entity";
import NotebookTable from "~/src/server/table/notebook.table";
import OptionTable from "~/src/server/table/option.table";
import OptionEntity from "~/src/common/entity/option.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import ProfitLogTable from "~/src/server/table/profit-log.table";
import SavedSearchTable from "~/src/server/table/saved-search.table";
import SavedSearchEntity from "~/src/common/entity/saved-search.entity";
import TagTable from "~/src/server/table/tag.table";
import TimeLogTable from "~/src/server/table/time-log.table";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import AttendanceTable from "~/src/server/table/attendance.table";
import AttendanceEntity from "~/src/common/entity/attendance.entity";

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

  get attendanceTable(): AttendanceTable {
    return this.getTable(AttendanceEntity);
  }

  get constraintResultTable(): ConstraintResultTable {
    return this.getTable(ConstraintResultEntity);
  }

  get linkedNotebookTable(): LinkedNotebookTable {
    return this.getTable(LinkedNotebookEntity);
  }

  get noteTable(): NoteTable {
    return this.getTable(NoteEntity);
  }

  get notebookTable(): NotebookTable {
    return this.getTable(NotebookEntity);
  }

  get optionTable(): OptionTable {
    return this.getTable(OptionEntity);
  }

  get profitLogTable(): ProfitLogTable {
    return this.getTable(ProfitLogEntity);
  }

  get savedSearchTable(): SavedSearchTable {
    return this.getTable(SavedSearchEntity);
  }

  get tagTable(): TagTable {
    return this.getTable(TagEntity);
  }

  get timeLogTable(): TimeLogTable {
    return this.getTable(TimeLogEntity);
  }

  async initialize(): Promise<void> {
    await this.getConnection();
    for (const table of container.getAll<BaseTable<BaseEntity>>(
      SYMBOL_TYPES.Table
    )) {
      await table.initialize();
      this.tables[table.EntityClass.params.name] = table;
    }
    await this.reloadCache();
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
    const archiveSchemas = tables
      .map(table => table.archiveSchema)
      .filter(
        (
          schema: EntitySchema<BaseEntity> | null
        ): schema is EntitySchema<BaseEntity> => !!schema
      );
    this.connection = await createConnection({
      type: "sqlite",
      database: filePath,
      entities: [...schemas, ...archiveSchemas],
      logging: false,
    });
    return this.connection;
  }

  getTable<TEntity extends BaseEntity, TTable extends BaseTable<TEntity>>(
    EntityClass: typeof BaseEntity
  ): TTable {
    return <TTable>this.tables[EntityClass.params.name];
  }

  async reloadCache(type: "tag" | "notebook" | "all" = "all"): Promise<void> {
    if (type === "tag" || type === "all")
      this.caches.tags = _.keyBy(await this.tagTable.findAll(), "guid");
    if (type === "notebook" || type === "all")
      this.caches.notebooks = _.keyBy(
        await this.notebookTable.findAll(),
        "guid"
      );
  }

  async sync(): Promise<void> {
    const connection = await this.getConnection();
    await connection.synchronize();
  }
}
