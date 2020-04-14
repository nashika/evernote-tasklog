import { Container } from "inversify";
import { EntitySchema } from "typeorm";

import {
  INVERSIFY_MODELS,
  INVERSIFY_TYPES,
} from "~/src/common/inversify.symbol";

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

import attendanceSchema from "~/src/server/schema/attendance.schema";

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

// Entity系
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(AttendanceEntity)
  .whenTargetNamed(INVERSIFY_MODELS.Attendance);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(ConstraintResultEntity)
  .whenTargetNamed(INVERSIFY_MODELS.ConstraintResult);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(LinkedNotebookEntity)
  .whenTargetNamed(INVERSIFY_MODELS.LinkedNotebook);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(NoteEntity)
  .whenTargetNamed(INVERSIFY_MODELS.Note);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(NotebookEntity)
  .whenTargetNamed(INVERSIFY_MODELS.Notebook);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(OptionEntity)
  .whenTargetNamed(INVERSIFY_MODELS.Option);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(ProfitLogEntity)
  .whenTargetNamed(INVERSIFY_MODELS.ProfitLog);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(SavedSearchEntity)
  .whenTargetNamed(INVERSIFY_MODELS.SavedSearch);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(TagEntity)
  .whenTargetNamed(INVERSIFY_MODELS.Tag);
container
  .bind<BaseEntity>(INVERSIFY_TYPES.Entity)
  .toConstructor(TimeLogEntity)
  .whenTargetNamed(INVERSIFY_MODELS.TimeLog);

// SEntity系
container
  .bind<EntitySchema>(INVERSIFY_TYPES.Schema)
  .toConstantValue(attendanceSchema)
  .whenTargetNamed(INVERSIFY_MODELS.Attendance);

// SService系
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

// Route系
container
  .bind<BaseRoute>(INVERSIFY_TYPES.Route)
  .to(AttendanceRoute)
  .whenTargetNamed(INVERSIFY_MODELS.Attendance);

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

export default container;
