import { Container } from "inversify";

import BaseCEntity from "~/src/common/c-entity/base.c-entity";
import AttendanceCEntity from "~/src/common/c-entity/attendance.c-entity";
import ConstraintResultCEntity from "~/src/common/c-entity/constraint-result.c-entity";
import LinkedNotebookCEntity from "~/src/common/c-entity/linked-notebook.c-entity";
import NoteCEntity from "~/src/common/c-entity/note.c-entity";
import NotebookCEntity from "~/src/common/c-entity/notebook.c-entity";
import OptionCEntity from "~/src/common/c-entity/option.c-entity";
import ProfitLogCEntity from "~/src/common/c-entity/profit-log.c-entity";
import SavedSearchCEntity from "~/src/common/c-entity/saved-search.c-entity";
import TagCEntity from "~/src/common/c-entity/tag.c-entity";
import TimeLogCEntity from "~/src/common/c-entity/time-log.c-entity";

import BaseSEntity from "~/src/server/s-entity/base.s-entity";
import AttendanceSEntity from "~/src/server/s-entity/attendance.s-entity";

import BaseRepository from "~/src/server/repository/base.repository";
import AttendanceRepository from "~/src/server/repository/attendance.repository";

import MainSService from "~/src/server/s-service/main.s-service";
import RepositorySService from "~/src/server/s-service/repository.s-service";
import SocketIoSService from "~/src/server/s-service/socket-io.s-service";
import SessionSService from "~/src/server/s-service/session.s-service";

import BaseRoute from "~/src/server/route/base.route";
import AttendanceRoute from "~/src/server/route/attendance.route";

/*
import { ConstraintService } from "~/server/service/constraint-service";
import { EvernoteClientService } from "~/server/service/evernote-client.service";
import { SessionService } from "~/server/service/session.service";
import { SyncService } from "~/server/service/sync.service";

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

const container = new Container();

container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(AttendanceCEntity)
  .whenTargetNamed("attendance");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(ConstraintResultCEntity)
  .whenTargetNamed("constraintResult");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(LinkedNotebookCEntity)
  .whenTargetNamed("linkedNotebook");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(NoteCEntity)
  .whenTargetNamed("note");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(NotebookCEntity)
  .whenTargetNamed("notebook");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(OptionCEntity)
  .whenTargetNamed("option");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(ProfitLogCEntity)
  .whenTargetNamed("profitLog");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(SavedSearchCEntity)
  .whenTargetNamed("savedSearch");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(TagCEntity)
  .whenTargetNamed("tag");
container
  .bind<BaseCEntity>(BaseCEntity)
  .toConstructor(TimeLogCEntity)
  .whenTargetNamed("timeLog");

container
  .bind<BaseSEntity>(BaseSEntity)
  .toConstructor(AttendanceSEntity)
  .whenTargetNamed("attendance");

container
  .bind<MainSService>(MainSService)
  .toSelf()
  .inSingletonScope();
container
  .bind<RepositorySService>(RepositorySService)
  .toSelf()
  .inSingletonScope();
container
  .bind<SocketIoSService>(SocketIoSService)
  .toSelf()
  .inSingletonScope();
container
  .bind<SessionSService>(SessionSService)
  .toSelf()
  .inSingletonScope();

container
  .bind<BaseRoute>(BaseRoute)
  .to(AttendanceRoute)
  .whenTargetNamed("attendance");

/*
container.bind<ConstraintService>(ConstraintService).toSelf().inSingletonScope();
container.bind<EvernoteClientService>(EvernoteClientService).toSelf().inSingletonScope();
container.bind<SocketIoServerService>(SocketIoServerService).toSelf().inSingletonScope();
container.bind<SyncService>(SyncService).toSelf().inSingletonScope();

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

export default container;
