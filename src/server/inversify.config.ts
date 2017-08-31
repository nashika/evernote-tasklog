import {Container} from "inversify";

import {BaseEntity} from "../common/entity/base.entity";
import {AttendanceEntity} from "../common/entity/attendance.entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook.entity";
import {NoteEntity} from "../common/entity/note.entity";
import {NotebookEntity} from "../common/entity/notebook.entity";
import {OptionEntity} from "../common/entity/option.entity";
import {ProfitLogEntity} from "../common/entity/profit-log.entity";
import {SavedSearchEntity} from "../common/entity/saved-search.entity";
import {TagEntity} from "../common/entity/tag.entity";
import {TimeLogEntity} from "../common/entity/time-log.entity";

import {ConstraintServerService} from "./service/constraint-server-service";
import {EvernoteClientService} from "./service/evernote-client.service";
import {MainService} from "./service/main.service";
import {SessionService} from "./service/session.service";
import {SocketIoServerService} from "./service/socket-io-server-service";
import {SyncService} from "./service/sync.service";
import {TableService} from "./service/table.service";

import {BaseRoute} from "./routes/base.route";
import {AttendanceRoute} from "./routes/attendance.route";
import {NoteRoute} from "./routes/note.route";
import {NotebookRoute} from "./routes/notebook.route";
import {OptionRoute} from "./routes/option.route";
import {ProfitLogRoute} from "./routes/profit-log.route";
import {SessionRoute} from "./routes/session.route";
import {SyncRoute} from "./routes/sync.route";
import {TagRoute} from "./routes/tag.route";
import {TimeLogRoute} from "./routes/time-log.route";

import {BaseTable} from "./table/base.table";
import {AttendanceTable} from "./table/attendance.table";
import {LinkedNotebookTable} from "./table/linked-notebook.table";
import {NoteTable} from "./table/note.table";
import {NotebookTable} from "./table/notebook.table";
import {OptionTable} from "./table/option.table";
import {ProfitLogTable} from "./table/profit-log.table";
import {SavedSearchTable} from "./table/saved-search.table";
import {TagTable} from "./table/tag.table";
import {TimeLogTable} from "./table/time-log.table";

export var container = new Container();

container.bind<BaseEntity>(BaseEntity).toConstructor(AttendanceEntity).whenTargetNamed("attendance");
container.bind<BaseEntity>(BaseEntity).toConstructor(LinkedNotebookEntity).whenTargetNamed("linkedNotebook");
container.bind<BaseEntity>(BaseEntity).toConstructor(NoteEntity).whenTargetNamed("note");
container.bind<BaseEntity>(BaseEntity).toConstructor(NotebookEntity).whenTargetNamed("notebook");
container.bind<BaseEntity>(BaseEntity).toConstructor(OptionEntity).whenTargetNamed("option");
container.bind<BaseEntity>(BaseEntity).toConstructor(ProfitLogEntity).whenTargetNamed("profitLog");
container.bind<BaseEntity>(BaseEntity).toConstructor(SavedSearchEntity).whenTargetNamed("savedSearch");
container.bind<BaseEntity>(BaseEntity).toConstructor(TagEntity).whenTargetNamed("tag");
container.bind<BaseEntity>(BaseEntity).toConstructor(TimeLogEntity).whenTargetNamed("timeLog");

container.bind<ConstraintServerService>(ConstraintServerService).toSelf().inSingletonScope();
container.bind<EvernoteClientService>(EvernoteClientService).toSelf().inSingletonScope();
container.bind<MainService>(MainService).toSelf().inSingletonScope();
container.bind<SessionService>(SessionService).toSelf().inSingletonScope();
container.bind<SocketIoServerService>(SocketIoServerService).toSelf().inSingletonScope();
container.bind<SyncService>(SyncService).toSelf().inSingletonScope();
container.bind<TableService>(TableService).toSelf().inSingletonScope();

container.bind<BaseRoute>(BaseRoute).to(AttendanceRoute).whenTargetNamed("attendance");
container.bind<BaseRoute>(BaseRoute).to(NoteRoute).whenTargetNamed("note");
container.bind<BaseRoute>(BaseRoute).to(NotebookRoute).whenTargetNamed("notebook");
container.bind<BaseRoute>(BaseRoute).to(OptionRoute).whenTargetNamed("option");
container.bind<BaseRoute>(BaseRoute).to(ProfitLogRoute).whenTargetNamed("profitLog");
container.bind<BaseRoute>(BaseRoute).to(SessionRoute).whenTargetNamed("session");
container.bind<BaseRoute>(BaseRoute).to(SyncRoute).whenTargetNamed("sync");
container.bind<BaseRoute>(BaseRoute).to(TagRoute).whenTargetNamed("tag");
container.bind<BaseRoute>(BaseRoute).to(TimeLogRoute).whenTargetNamed("timeLog");

container.bind<BaseTable<AttendanceEntity>>(BaseTable).to(AttendanceTable).whenTargetNamed("attendance");
container.bind<BaseTable<LinkedNotebookEntity>>(BaseTable).to(LinkedNotebookTable).whenTargetNamed("linkedNotebook");
container.bind<BaseTable<NoteEntity>>(BaseTable).to(NoteTable).whenTargetNamed("note");
container.bind<BaseTable<NotebookEntity>>(BaseTable).to(NotebookTable).whenTargetNamed("notebook");
container.bind<BaseTable<ProfitLogEntity>>(BaseTable).to(ProfitLogTable).whenTargetNamed("profitLog");
container.bind<BaseTable<SavedSearchEntity>>(BaseTable).to(SavedSearchTable).whenTargetNamed("savedSearch");
container.bind<BaseTable<OptionEntity>>(BaseTable).to(OptionTable).whenTargetNamed("option");
container.bind<BaseTable<TagEntity>>(BaseTable).to(TagTable).whenTargetNamed("tag");
container.bind<BaseTable<TimeLogEntity>>(BaseTable).to(TimeLogTable).whenTargetNamed("timeLog");
