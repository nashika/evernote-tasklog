import * as log4js from "log4js";
import * as evernote from "evernote";

import Www from "./www";
import SettingEntity from "./models/entities/setting-entity";
import UserEntity from "./models/entities/user-entity";
import LinkedNotebookTable from "./models/tables/linked-notebook-table";
import SettingTable from "./models/tables/setting-table";
import NoteTable from "./models/tables/note-table";
import NotebookTable from "./models/tables/notebook-table";
import ProfitLogTable from "./models/tables/profit-log-table";
import SearchTable from "./models/tables/search-table";
import SyncStateTable from "./models/tables/sync-state-table";
import TagTable from "./models/tables/tag-table";
import TimeLogTable from "./models/tables/time-log-table";
import UserTable from "./models/tables/user-table";

interface UserSetting {
    persons:Array<{name:string}>;
}

interface UserCore {
    client?:evernote.Evernote.Client;
    user?:UserEntity;
    settings?:UserSetting;
    models?: {
        linkedNotebooks:LinkedNotebookTable,
        notes:NoteTable,
        notebooks:NotebookTable,
        profitLogs:ProfitLogTable,
        searches:SearchTable,
        settings:SettingTable,
        syncStates:SyncStateTable,
        tags:TagTable,
        timeLogs:TimeLogTable,
        users:UserTable,
    };
}

export class Core {
    www:Www;
    settings:Object;
    loggers:{
        system?:log4js.Logger,
        access?:log4js.Logger,
        error?:log4js.Logger,
    };
    models:{
        settings?:SettingTable,
    };
    users:{[username:string]:UserCore};

    constructor() {
        this.loggers = {};
        this.models = {};
        this.users = {};
    }
}

var core = new Core();

export default core;

