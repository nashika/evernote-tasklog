import { Container } from "inversify";

import { SYMBOL_TABLES, SYMBOL_TYPES } from "~/src/common/symbols";

import BaseEntity from "~/src/common/entity/base.entity";
import AttendanceEntity from "~/src/common/entity/attendance.entity";
import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import LinkedNotebookEntity from "~/src/common/entity/linked-notebook.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import NotebookEntity from "~/src/common/entity/notebook.entity";
import OptionEntity from "~/src/common/entity/option.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import SavedSearchEntity from "~/src/common/entity/saved-search.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import TimeLogEntity from "~/src/common/entity/time-log.entity";

import ConstraintService from "~/src/server/service/constraint.service";
import EvernoteClientService from "~/src/server/service/evernote-client.service";
import MainService from "~/src/server/service/main.service";
import TableService from "~/src/server/service/table.service";
import SocketIoService from "~/src/server/service/socket-io.service";
import SessionService from "~/src/server/service/session.service";
import SyncService from "~/src/server/service/sync.service";

import BaseRoute from "~/src/server/route/base.route";
import AttendanceRoute from "~/src/server/route/attendance.route";
import ConstraintResultRoute from "~/src/server/route/constraint-result.route";
import NoteRoute from "~/src/server/route/note.route";
import NotebookRoute from "~/src/server/route/notebook.route";
import OptionRoute from "~/src/server/route/option.route";
import ProfitLogRoute from "~/src/server/route/profit-log.route";
import SessionRoute from "~/src/server/route/session.route";
import SyncRoute from "~/src/server/route/sync.route";
import TagRoute from "~/src/server/route/tag.route";
import TimeLogRoute from "~/src/server/route/time-log.route";

import BaseTable from "~/src/server/table/base.table";
import AttendanceTable from "~/src/server/table/attendance.table";
import ConstraintResultTable from "~/src/server/table/constraint-result.table";
import LinkedNotebookTable from "~/src/server/table/linked-notebook.table";
import NoteTable from "~/src/server/table/note.table";
import NotebookTable from "~/src/server/table/notebook.table";
import OptionTable from "~/src/server/table/option.table";
import ProfitLogTable from "~/src/server/table/profit-log.table";
import SavedSearchTable from "~/src/server/table/saved-search.table";
import TagTable from "~/src/server/table/tag.table";
import TimeLogTable from "~/src/server/table/time-log.table";

const container = new Container();

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
  .toConstructor(TagEntity)
  .whenTargetNamed(SYMBOL_TABLES.tag);
container
  .bind<BaseEntity>(SYMBOL_TYPES.Entity)
  .toConstructor(TimeLogEntity)
  .whenTargetNamed(SYMBOL_TABLES.timeLog);

// Service系
container
  .bind<ConstraintService>(ConstraintService)
  .toSelf()
  .inSingletonScope();
container
  .bind<EvernoteClientService>(EvernoteClientService)
  .toSelf()
  .inSingletonScope();
container
  .bind<MainService>(MainService)
  .toSelf()
  .inSingletonScope();
container
  .bind<TableService>(TableService)
  .toSelf()
  .inSingletonScope();
container
  .bind<SocketIoService>(SocketIoService)
  .toSelf()
  .inSingletonScope();
container
  .bind<SessionService>(SessionService)
  .toSelf()
  .inSingletonScope();
container
  .bind<SyncService>(SyncService)
  .toSelf()
  .inSingletonScope();

// Route系
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(AttendanceRoute)
  .whenTargetNamed(SYMBOL_TABLES.attendance);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(ConstraintResultRoute)
  .whenTargetNamed(SYMBOL_TABLES.constraintResult);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(NoteRoute)
  .whenTargetNamed(SYMBOL_TABLES.note);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(NotebookRoute)
  .whenTargetNamed(SYMBOL_TABLES.notebook);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(OptionRoute)
  .whenTargetNamed(SYMBOL_TABLES.option);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(ProfitLogRoute)
  .whenTargetNamed(SYMBOL_TABLES.profitLog);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(SessionRoute)
  .whenTargetNamed("session");
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(SyncRoute)
  .whenTargetNamed("sync");
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(TagRoute)
  .whenTargetNamed(SYMBOL_TABLES.tag);
container
  .bind<BaseRoute>(SYMBOL_TYPES.Route)
  .to(TimeLogRoute)
  .whenTargetNamed(SYMBOL_TABLES.timeLog);

// Table系
container
  .bind<BaseTable<BaseEntity>>(SYMBOL_TYPES.Table)
  .to(AttendanceTable)
  .whenTargetNamed(SYMBOL_TABLES.attendance);
container
  .bind<BaseTable<ConstraintResultEntity>>(SYMBOL_TYPES.Table)
  .to(ConstraintResultTable)
  .whenTargetNamed(SYMBOL_TABLES.constraintResult);
container
  .bind<BaseTable<LinkedNotebookEntity>>(SYMBOL_TYPES.Table)
  .to(LinkedNotebookTable)
  .whenTargetNamed(SYMBOL_TABLES.linkedNotebook);
container
  .bind<BaseTable<NoteEntity>>(SYMBOL_TYPES.Table)
  .to(NoteTable)
  .whenTargetNamed(SYMBOL_TABLES.note);
container
  .bind<BaseTable<NotebookEntity>>(SYMBOL_TYPES.Table)
  .to(NotebookTable)
  .whenTargetNamed(SYMBOL_TABLES.notebook);
container
  .bind<BaseTable<ProfitLogEntity>>(SYMBOL_TYPES.Table)
  .to(ProfitLogTable)
  .whenTargetNamed(SYMBOL_TABLES.profitLog);
container
  .bind<BaseTable<SavedSearchEntity>>(SYMBOL_TYPES.Table)
  .to(SavedSearchTable)
  .whenTargetNamed(SYMBOL_TABLES.savedSearch);
container
  .bind<BaseTable<OptionEntity>>(SYMBOL_TYPES.Table)
  .to(OptionTable)
  .whenTargetNamed(SYMBOL_TABLES.option);
container
  .bind<BaseTable<TagEntity>>(SYMBOL_TYPES.Table)
  .to(TagTable)
  .whenTargetNamed(SYMBOL_TABLES.tag);
container
  .bind<BaseTable<TimeLogEntity>>(SYMBOL_TYPES.Table)
  .to(TimeLogTable)
  .whenTargetNamed(SYMBOL_TABLES.timeLog);

export default container;
