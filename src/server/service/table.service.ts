import * as path from "path";

import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseServerService} from "./base-server.service";
import {BaseTable} from "../table/base.table";
import {BaseEntity} from "../../common/entity/base.entity";
import {container} from "../inversify.config";
import {ConstraintResultEntity} from "../../common/entity/constraint-result.entity";
import {ConstraintResultTable} from "../table/constraint-result.table";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {OptionEntity} from "../../common/entity/option.entity";
import {OptionTable} from "../table/option.table";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {NotebookTable} from "../table/notebook.table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {LinkedNotebookTable} from "../table/linked-notebook.table";
import {TagTable} from "../table/tag.table";
import {TagEntity} from "../../common/entity/tag.entity";
import {SavedSearchTable} from "../table/saved-search.table";
import {SavedSearchEntity} from "../../common/entity/saved-search.entity";
import {TimeLogTable} from "../table/time-log.table";
import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {ProfitLogTable} from "../table/profit-log.table";

@injectable()
export class TableService extends BaseServerService {

  private database: sequelize.Sequelize;
  private tables: { [tableName: string]: BaseTable<BaseEntity> };

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
    let database = this.getDatabase();
    this.tables = {};
    for (let table of container.getAll<BaseTable<BaseEntity>>(BaseTable)) {
      this.tables[table.EntityClass.params.name] = table;
      table.initialize(database);
    }
  }

  getDatabase(): sequelize.Sequelize {
    if (!this.database) {
      let filePath = path.join(__dirname, "../../../db/database.db");
      this.database = new sequelize("", "", null, {
        dialect: "sqlite",
        storage: filePath,
        logging: false
      });
    }
    return this.database;
  }

  getTable<T extends BaseTable<BaseEntity>>(EntityClass: typeof BaseEntity): T {
    return <T>this.tables[EntityClass.params.name];
  }

  async sync(): Promise<void> {
    await this.getDatabase().sync();
  }

}
