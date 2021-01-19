import "reflect-metadata";
import { Container } from "inversify";

import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";
import { BaseEntity } from "~/src/common/entity/base.entity";
import { AttendanceEntity } from "~/src/common/entity/attendance.entity";
import { ConstraintResultEntity } from "~/src/common/entity/constraint-result.entity";
import { LinkedNotebookEntity } from "~/src/common/entity/linked-notebook.entity";
import { NoteEntity } from "~/src/common/entity/note.entity";
import { NotebookEntity } from "~/src/common/entity/notebook.entity";
import { OptionEntity } from "~/src/common/entity/option.entity";
import { ProfitLogEntity } from "~/src/common/entity/profit-log.entity";
import { SavedSearchEntity } from "~/src/common/entity/saved-search.entity";
import { SessionEntity } from "~/src/common/entity/session.entity";
import { TagEntity } from "~/src/common/entity/tag.entity";
import { TimeLogEntity } from "~/src/common/entity/time-log.entity";

export const container = new Container();

// Entity系
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(AttendanceEntity)
  .whenTargetNamed(SYMBOL_TABLES.attendance);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(ConstraintResultEntity)
  .whenTargetNamed(SYMBOL_TABLES.constraintResult);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(LinkedNotebookEntity)
  .whenTargetNamed(SYMBOL_TABLES.linkedNotebook);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(NoteEntity)
  .whenTargetNamed(SYMBOL_TABLES.note);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(NotebookEntity)
  .whenTargetNamed(SYMBOL_TABLES.notebook);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(OptionEntity)
  .whenTargetNamed(SYMBOL_TABLES.option);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(ProfitLogEntity)
  .whenTargetNamed(SYMBOL_TABLES.profitLog);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(SavedSearchEntity)
  .whenTargetNamed(SYMBOL_TABLES.savedSearch);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(SessionEntity)
  .whenTargetNamed(SYMBOL_TABLES.session);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(TagEntity)
  .whenTargetNamed(SYMBOL_TABLES.tag);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(TimeLogEntity)
  .whenTargetNamed(SYMBOL_TABLES.timeLog);
