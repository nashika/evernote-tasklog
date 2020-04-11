import { Container } from "inversify";

import { BaseEntity } from "~/common/entity/base.entity";
import { AttendanceEntity } from "~/common/entity/attendance.entity";
import { ConstraintResultEntity } from "~/common/entity/constraint-result.entity";
import { LinkedNotebookEntity } from "~/common/entity/linked-notebook.entity";
import { NoteEntity } from "~/common/entity/note.entity";
import { NotebookEntity } from "~/common/entity/notebook.entity";
import { OptionEntity } from "~/common/entity/option.entity";
import { ProfitLogEntity } from "~/common/entity/profit-log.entity";
import { SavedSearchEntity } from "~/common/entity/saved-search.entity";
import { TagEntity } from "~/common/entity/tag.entity";
import { TimeLogEntity } from "~/common/entity/time-log.entity";
import { BaseRepository } from "~/server/repository/base.repository";
import { AttendanceSEntity } from "~/server/s-entity/attendance.s-entity";
import { AttendanceRepository } from "~/server/repository/attendance.repository";

import { MainService } from "~/server/service/main.service";
import { TableService } from "~/server/service/table.service";

/*
import { ConstraintService } from "~/server/service/constraint-service";
import { EvernoteClientService } from "~/server/service/evernote-client.service";
import { SessionService } from "~/server/service/session.service";
import { SocketIoServerService } from "~/server/service/socket-io-server-service";
import { SyncService } from "~/server/service/sync.service";

import { BaseRoute } from "~/server/routes/base.route";
import { AttendanceRoute } from "~/server/routes/attendance.route";
import { ConstraintResultRoute } from "~/server/routes/constraint-result.route";
import { NoteRoute } from "~/server/routes/note.route";
import { NotebookRoute } from "~/server/routes/notebook.route";
import { OptionRoute } from "~/server/routes/option.route";
import { ProfitLogRoute } from "~/server/routes/profit-log.route";
import { SessionRoute } from "~/server/routes/session.route";
import { SyncRoute } from "~/server/routes/sync.route";
import { TagRoute } from "~/server/routes/tag.route";
import { TimeLogRoute } from "~/server/routes/time-log.route";

import { BaseTable } from "~/server/table/base.table";
import { AttendanceTable } from "~/server/table/attendance.table";
import { ConstraintResultTable } from "~/server/table/constraint-result.table";
import { LinkedNotebookTable } from "~/server/table/linked-notebook.table";
import { NoteTable } from "~/server/table/note.table";
import { NotebookTable } from "~/server/table/notebook.table";
import { OptionTable } from "~/server/table/option.table";
import { ProfitLogTable } from "~/server/table/profit-log.table";
import { SavedSearchTable } from "~/server/table/saved-search.table";
import { TagTable } from "~/server/table/tag.table";
import { TimeLogTable } from "~/server/table/time-log.table";
*/

export const container = new Container();

container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(AttendanceEntity)
  .whenTargetNamed("attendance");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(ConstraintResultEntity)
  .whenTargetNamed("constraintResult");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(LinkedNotebookEntity)
  .whenTargetNamed("linkedNotebook");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(NoteEntity)
  .whenTargetNamed("note");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(NotebookEntity)
  .whenTargetNamed("notebook");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(OptionEntity)
  .whenTargetNamed("option");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(ProfitLogEntity)
  .whenTargetNamed("profitLog");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(SavedSearchEntity)
  .whenTargetNamed("savedSearch");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(TagEntity)
  .whenTargetNamed("tag");
container
  .bind<BaseEntity>(BaseEntity)
  .toConstructor(TimeLogEntity)
  .whenTargetNamed("timeLog");

container
  .bind<MainService>(MainService)
  .toSelf()
  .inSingletonScope();
container
  .bind<TableService>(TableService)
  .toSelf()
  .inSingletonScope();

/*
container.bind<ConstraintService>(ConstraintService).toSelf().inSingletonScope();
container.bind<EvernoteClientService>(EvernoteClientService).toSelf().inSingletonScope();
container.bind<SessionService>(SessionService).toSelf().inSingletonScope();
container.bind<SocketIoServerService>(SocketIoServerService).toSelf().inSingletonScope();
container.bind<SyncService>(SyncService).toSelf().inSingletonScope();
container.bind<TableService>(TableService).toSelf().inSingletonScope();

container.bind<BaseRoute>(BaseRoute).to(AttendanceRoute).whenTargetNamed("attendance");
container.bind<BaseRoute>(BaseRoute).to(ConstraintResultRoute).whenTargetNamed("constraintResult");
container.bind<BaseRoute>(BaseRoute).to(NoteRoute).whenTargetNamed("note");
container.bind<BaseRoute>(BaseRoute).to(NotebookRoute).whenTargetNamed("notebook");
container.bind<BaseRoute>(BaseRoute).to(OptionRoute).whenTargetNamed("option");
container.bind<BaseRoute>(BaseRoute).to(ProfitLogRoute).whenTargetNamed("profitLog");
container.bind<BaseRoute>(BaseRoute).to(SessionRoute).whenTargetNamed("session");
container.bind<BaseRoute>(BaseRoute).to(SyncRoute).whenTargetNamed("sync");
container.bind<BaseRoute>(BaseRoute).to(TagRoute).whenTargetNamed("tag");
container.bind<BaseRoute>(BaseRoute).to(TimeLogRoute).whenTargetNamed("timeLog");

container.bind<BaseTable<ConstraintResultEntity>>(BaseTable).to(ConstraintResultTable).whenTargetNamed("constraintResult");
container.bind<BaseTable<LinkedNotebookEntity>>(BaseTable).to(LinkedNotebookTable).whenTargetNamed("linkedNotebook");
container.bind<BaseTable<NoteEntity>>(BaseTable).to(NoteTable).whenTargetNamed("note");
container.bind<BaseTable<NotebookEntity>>(BaseTable).to(NotebookTable).whenTargetNamed("notebook");
container.bind<BaseTable<ProfitLogEntity>>(BaseTable).to(ProfitLogTable).whenTargetNamed("profitLog");
container.bind<BaseTable<SavedSearchEntity>>(BaseTable).to(SavedSearchTable).whenTargetNamed("savedSearch");
container.bind<BaseTable<OptionEntity>>(BaseTable).to(OptionTable).whenTargetNamed("option");
container.bind<BaseTable<TagEntity>>(BaseTable).to(TagTable).whenTargetNamed("tag");
container.bind<BaseTable<TimeLogEntity>>(BaseTable).to(TimeLogTable).whenTargetNamed("timeLog");
 */

container
  .bind<BaseRepository<AttendanceSEntity>>(BaseRepository)
  .toConstructor(AttendanceRepository)
  .whenTargetNamed("attendance");
