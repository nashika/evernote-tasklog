import {Kernel} from "inversify";

import {BaseEntity} from "../common/entity/base-entity";
import {AuthEntity} from "../common/entity/auth-entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook-entity";
import {NoteEntity} from "../common/entity/note-entity";
import {NotebookEntity} from "../common/entity/notebook-entity";
import {ProfitLogEntity} from "../common/entity/profit-log-entity";
import {SearchEntity} from "../common/entity/serch-entity";
import {SettingEntity} from "../common/entity/setting-entity";
import {SyncStateEntity} from "../common/entity/sync-state-entity";
import {TagEntity} from "../common/entity/tag-entity";
import {TimeLogEntity} from "../common/entity/time-log-entity";
import {UserEntity} from "../common/entity/user-entity";

import {SessionService} from "./service/session-service";

import {BaseRoute} from "./routes/base-route";
import {AuthRoute} from "./routes/auth-route";
import {IndexRoute} from "./routes/index-route";
import {NoteRoute} from "./routes/note-route";
import {NotebookRoute} from "./routes/notebook-route";
import {ProfitLogRoute} from "./routes/profit-log-route";
import {SettingRoute} from "./routes/setting-route";
import {SyncRoute} from "./routes/sync-route";
import {TimeLogRoute} from "./routes/time-log-route";
import {UserRoute} from "./routes/user-route";

import {BaseTable} from "./table/base-table";
import {LinkedNotebookTable} from "./table/linked-notebook-table";
import {NoteTable} from "./table/note-table";
import {NotebookTable} from "./table/notebook-table";
import {ProfitLogTable} from "./table/profit-log-table";
import {SearchTable} from "./table/search-table";
import {SettingTable} from "./table/setting-table";
import {SyncStateTable} from "./table/sync-state-table";
import {TagTable} from "./table/tag-table";
import {TimeLogTable} from "./table/time-log-table";
import {UserTable} from "./table/user-table";

export var kernel = new Kernel();

kernel.bind<BaseEntity>(BaseEntity).toConstructor(AuthEntity).whenTargetNamed("auth");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(LinkedNotebookEntity).whenTargetNamed("linkedNotebook");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(NoteEntity).whenTargetNamed("note");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(NotebookEntity).whenTargetNamed("notebook");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(ProfitLogEntity).whenTargetNamed("profitLog");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(SearchEntity).whenTargetNamed("search");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(SettingEntity).whenTargetNamed("setting");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(SyncStateEntity).whenTargetNamed("syncState");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(TagEntity).whenTargetNamed("tag");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(TimeLogEntity).whenTargetNamed("timeLog");
kernel.bind<BaseEntity>(BaseEntity).toConstructor(UserEntity).whenTargetNamed("user");

kernel.bind<SessionService>(SessionService).toSelf().inSingletonScope();

kernel.bind<BaseRoute>(BaseRoute).to(AuthRoute).whenTargetNamed("auth");
kernel.bind<BaseRoute>(BaseRoute).to(IndexRoute).whenTargetNamed("index");
kernel.bind<BaseRoute>(BaseRoute).to(NoteRoute).whenTargetNamed("note");
kernel.bind<BaseRoute>(BaseRoute).to(NotebookRoute).whenTargetNamed("notebook");
kernel.bind<BaseRoute>(BaseRoute).to(ProfitLogRoute).whenTargetNamed("profitLog");
kernel.bind<BaseRoute>(BaseRoute).to(SettingRoute).whenTargetNamed("setting");
kernel.bind<BaseRoute>(BaseRoute).to(SyncRoute).whenTargetNamed("sync");
kernel.bind<BaseRoute>(BaseRoute).to(TimeLogRoute).whenTargetNamed("timeLog");
kernel.bind<BaseRoute>(BaseRoute).to(UserRoute).whenTargetNamed("user");

kernel.bind<BaseTable>(BaseTable).to(LinkedNotebookTable).whenTargetNamed("linkedNotebook");
kernel.bind<BaseTable>(BaseTable).to(NoteTable).whenTargetNamed("note");
kernel.bind<BaseTable>(BaseTable).to(NotebookTable).whenTargetNamed("notebook");
kernel.bind<BaseTable>(BaseTable).to(ProfitLogTable).whenTargetNamed("profitLog");
kernel.bind<BaseTable>(BaseTable).to(SearchTable).whenTargetNamed("search");
kernel.bind<BaseTable>(BaseTable).to(SettingTable).whenTargetNamed("setting");
kernel.bind<BaseTable>(BaseTable).to(SyncStateTable).whenTargetNamed("syncState");
kernel.bind<BaseTable>(BaseTable).to(TagTable).whenTargetNamed("tag");
kernel.bind<BaseTable>(BaseTable).to(TimeLogTable).whenTargetNamed("timeLog");
kernel.bind<BaseTable>(BaseTable).to(UserTable).whenTargetNamed("user");
