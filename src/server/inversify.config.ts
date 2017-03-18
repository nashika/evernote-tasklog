import {Container} from "inversify";

import {BaseEntity} from "../common/entity/base.entity";
import {GlobalUserEntity} from "../common/entity/global-user.entity";
import {LinkedNotebookEntity} from "../common/entity/linked-notebook.entity";
import {NoteEntity} from "../common/entity/note.entity";
import {NotebookEntity} from "../common/entity/notebook.entity";
import {ProfitLogEntity} from "../common/entity/profit-log.entity";
import {SearchEntity} from "../common/entity/serch.entity";
import {SettingEntity} from "../common/entity/setting.entity";
import {SyncStateEntity} from "../common/entity/sync-state.entity";
import {TagEntity} from "../common/entity/tag.entity";
import {TimeLogEntity} from "../common/entity/time-log.entity";
import {UserEntity} from "../common/entity/user.entity";

import {EvernoteClientService} from "./service/evernote-client.service";
import {MainService} from "./service/main.service";
import {SessionService} from "./service/session.service";
import {SettingService} from "./service/setting.service";
import {SyncService} from "./service/sync.service";
import {TableService} from "./service/table.service";

import {BaseRoute} from "./routes/base.route";
import {GlobalUserRoute} from "./routes/global-user.route";
import {IndexRoute} from "./routes/index.route";
import {NoteRoute} from "./routes/note.route";
import {NotebookRoute} from "./routes/notebook.route";
import {ProfitLogRoute} from "./routes/profit-log.route";
import {SettingRoute} from "./routes/setting.route";
import {SyncRoute} from "./routes/sync.route";
import {TagRoute} from "./routes/tag.route";
import {TimeLogRoute} from "./routes/time-log.route";
import {UserRoute} from "./routes/user.route";

import {BaseTable} from "./table/base.table";
import {GlobalUserTable} from "./table/global-user.table";
import {LinkedNotebookTable} from "./table/linked-notebook.table";
import {NoteTable} from "./table/note.table";
import {NotebookTable} from "./table/notebook.table";
import {ProfitLogTable} from "./table/profit-log.table";
import {SearchTable} from "./table/search.table";
import {SettingTable} from "./table/setting.table";
import {SyncStateTable} from "./table/sync-state.table";
import {TagTable} from "./table/tag.table";
import {TimeLogTable} from "./table/time-log.table";
import {UserTable} from "./table/user.table";

export var container = new Container();

container.bind<BaseEntity>(BaseEntity).toConstructor(GlobalUserEntity).whenTargetNamed("globalUser");
container.bind<BaseEntity>(BaseEntity).toConstructor(LinkedNotebookEntity).whenTargetNamed("linkedNotebook");
container.bind<BaseEntity>(BaseEntity).toConstructor(NoteEntity).whenTargetNamed("note");
container.bind<BaseEntity>(BaseEntity).toConstructor(NotebookEntity).whenTargetNamed("notebook");
container.bind<BaseEntity>(BaseEntity).toConstructor(ProfitLogEntity).whenTargetNamed("profitLog");
container.bind<BaseEntity>(BaseEntity).toConstructor(SearchEntity).whenTargetNamed("search");
container.bind<BaseEntity>(BaseEntity).toConstructor(SettingEntity).whenTargetNamed("setting");
container.bind<BaseEntity>(BaseEntity).toConstructor(SyncStateEntity).whenTargetNamed("syncState");
container.bind<BaseEntity>(BaseEntity).toConstructor(TagEntity).whenTargetNamed("tag");
container.bind<BaseEntity>(BaseEntity).toConstructor(TimeLogEntity).whenTargetNamed("timeLog");
container.bind<BaseEntity>(BaseEntity).toConstructor(UserEntity).whenTargetNamed("user");

container.bind<EvernoteClientService>(EvernoteClientService).toSelf().inSingletonScope();
container.bind<MainService>(MainService).toSelf().inSingletonScope();
container.bind<SessionService>(SessionService).toSelf().inSingletonScope();
container.bind<SettingService>(SettingService).toSelf().inSingletonScope();
container.bind<SyncService>(SyncService).toSelf().inSingletonScope();
container.bind<TableService>(TableService).toSelf().inSingletonScope();

container.bind<BaseRoute>(BaseRoute).to(IndexRoute).whenTargetNamed("index");
container.bind<BaseRoute>(BaseRoute).to(GlobalUserRoute).whenTargetNamed("globalUser");
container.bind<BaseRoute>(BaseRoute).to(NoteRoute).whenTargetNamed("note");
container.bind<BaseRoute>(BaseRoute).to(NotebookRoute).whenTargetNamed("notebook");
container.bind<BaseRoute>(BaseRoute).to(ProfitLogRoute).whenTargetNamed("profitLog");
container.bind<BaseRoute>(BaseRoute).to(SettingRoute).whenTargetNamed("setting");
container.bind<BaseRoute>(BaseRoute).to(SyncRoute).whenTargetNamed("sync");
container.bind<BaseRoute>(BaseRoute).to(TagRoute).whenTargetNamed("tag");
container.bind<BaseRoute>(BaseRoute).to(TimeLogRoute).whenTargetNamed("timeLog");
container.bind<BaseRoute>(BaseRoute).to(UserRoute).whenTargetNamed("user");

container.bind<BaseTable<LinkedNotebookEntity>>(BaseTable).to(LinkedNotebookTable).whenTargetNamed("linkedNotebook");
container.bind<BaseTable<GlobalUserEntity>>(BaseTable).to(GlobalUserTable).whenTargetNamed("globalUser");
container.bind<BaseTable<NoteEntity>>(BaseTable).to(NoteTable).whenTargetNamed("note");
container.bind<BaseTable<NotebookEntity>>(BaseTable).to(NotebookTable).whenTargetNamed("notebook");
container.bind<BaseTable<ProfitLogEntity>>(BaseTable).to(ProfitLogTable).whenTargetNamed("profitLog");
container.bind<BaseTable<SearchEntity>>(BaseTable).to(SearchTable).whenTargetNamed("search");
container.bind<BaseTable<SettingEntity>>(BaseTable).to(SettingTable).whenTargetNamed("setting");
container.bind<BaseTable<SyncStateEntity>>(BaseTable).to(SyncStateTable).whenTargetNamed("syncState");
container.bind<BaseTable<TagEntity>>(BaseTable).to(TagTable).whenTargetNamed("tag");
container.bind<BaseTable<TimeLogEntity>>(BaseTable).to(TimeLogTable).whenTargetNamed("timeLog");
container.bind<BaseTable<UserEntity>>(BaseTable).to(UserTable).whenTargetNamed("user");
