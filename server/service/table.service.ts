import * as path from "path";
import * as _ from "lodash";

import { injectable } from "inversify";

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
import { BaseServerService } from "./base-server.service";
import { BaseEntity } from "~/common/entity/base.entity";
import { container } from "~/inversify.config";
import { ConstraintResultEntity } from "~/common/entity/constraint-result.entity";
import { NoteEntity } from "~/common/entity/note.entity";
import { OptionEntity } from "~/common/entity/option.entity";
import { NotebookEntity } from "~/common/entity/notebook.entity";
import { TagEntity } from "~/common/entity/tag.entity";
import { SavedSearchEntity } from "~/common/entity/saved-search.entity";
import { TimeLogEntity } from "~/common/entity/time-log.entity";
import { ProfitLogEntity } from "~/common/entity/profit-log.entity";

@injectable()
export class TableService extends BaseServerService {
  caches: {
    tags: { [guid: string]: TagEntity };
    notebooks: { [guid: string]: NotebookEntity };
  };

  private database: sequelize.Sequelize | null = null;
  private readonly tables: { [tableName: string]: BaseTable<BaseEntity> };

  constructor() {
    super();
    this.caches = {
      tags: {},
      notebooks: {},
    };
    this.tables = {};
  }

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

  async initialize(): Promise<void> {
    this.getDatabase();
    for (const table of container.getAll<BaseTable<BaseEntity>>(BaseTable)) {
      this.tables[table.EntityClass.params.name] = table;
      await table.initialize();
    }
    await this.reloadCache();
  }

  getDatabase(): sequelize.Sequelize {
    if (!this.database) {
      const filePath = path.join(__dirname, "../../../db/database.db");
      this.database = new sequelize.Sequelize("", "", "", {
        dialect: "sqlite",
        storage: filePath,
        logging: false,
      });
    }
    return this.database;
  }

  getTable<T extends BaseTable<BaseEntity>>(EntityClass: typeof BaseEntity): T {
    return <T>this.tables[EntityClass.params.name];
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
    await this.getDatabase().sync();
  }
}
