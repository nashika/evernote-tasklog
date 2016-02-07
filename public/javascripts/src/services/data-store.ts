import {NoteEntity} from "../../../../lib/models/entities/note-entity";
import {UserEntity} from "../../../../lib/models/entities/user-entity";
import {TimeLogEntity} from "../../../../lib/models/entities/time-log-entity";
import {ProfitLogEntity} from "../../../../lib/models/entities/profit-log-entity";
import {NotebookEntity} from "../../../../lib/models/entities/notebook-entity";

export class DataStoreService {

    user:UserEntity = null;
    persons:Array<Object> = [];
    notebooks:{[guid:string]:NotebookEntity} = {};
    stacks:Array<string> = [];
    notes:{[guid:string]:NoteEntity} = {};
    timeLogs:{[noteGuid:string]:{[_id:string]:TimeLogEntity}} = {};
    profitLogs:{[noteGuid:string]:{[_id:string]:ProfitLogEntity}} = {};
    settings:{[key:string]:any} = {};

}

angular.module('App').service('dataStore', [DataStoreService]);
