import {Kernel} from "inversify";

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


kernel.bind<SessionService>(SessionService).toSelf();


kernel.bind<BaseRoute>(BaseRoute).to(AuthRoute).whenTargetNamed("auth");
kernel.bind<BaseRoute>(BaseRoute).to(IndexRoute).whenTargetNamed("index");
kernel.bind<BaseRoute>(BaseRoute).to(NoteRoute).whenTargetNamed("note");
kernel.bind<BaseRoute>(BaseRoute).to(NotebookRoute).whenTargetNamed("notebook");
kernel.bind<BaseRoute>(BaseRoute).to(ProfitLogRoute).whenTargetNamed("profit-log");
kernel.bind<BaseRoute>(BaseRoute).to(SettingRoute).whenTargetNamed("setting");
kernel.bind<BaseRoute>(BaseRoute).to(SyncRoute).whenTargetNamed("sync");
kernel.bind<BaseRoute>(BaseRoute).to(TimeLogRoute).whenTargetNamed("time-log");
kernel.bind<BaseRoute>(BaseRoute).to(UserRoute).whenTargetNamed("user");

kernel.bind<BaseTable>(BaseTable).to(LinkedNotebookTable).inSingletonScope().whenTargetNamed("linked-notebook");
kernel.bind<BaseTable>(BaseTable).to(NoteTable).inSingletonScope().whenTargetNamed("note");
kernel.bind<BaseTable>(BaseTable).to(NotebookTable).inSingletonScope().whenTargetNamed("notebook");
kernel.bind<BaseTable>(BaseTable).to(ProfitLogTable).inSingletonScope().whenTargetNamed("profit-log");
kernel.bind<BaseTable>(BaseTable).to(SearchTable).inSingletonScope().whenTargetNamed("search");
kernel.bind<BaseTable>(BaseTable).to(SettingTable).inSingletonScope().whenTargetNamed("setting");
kernel.bind<BaseTable>(BaseTable).to(SyncStateTable).inSingletonScope().whenTargetNamed("sync-state");
kernel.bind<BaseTable>(BaseTable).to(TagTable).inSingletonScope().whenTargetNamed("tag");
kernel.bind<BaseTable>(BaseTable).to(TimeLogTable).inSingletonScope().whenTargetNamed("time-log");
kernel.bind<BaseTable>(BaseTable).to(UserTable).inSingletonScope().whenTargetNamed("user");
