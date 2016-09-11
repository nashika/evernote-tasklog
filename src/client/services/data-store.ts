import {NoteEntity} from "../../../../src/common/entities/note-entity";
import {UserEntity} from "../../../../src/common/entities/user-entity";
import {TimeLogEntity} from "../../../../src/common/entities/time-log-entity";
import {ProfitLogEntity} from "../../../../src/common/entities/profit-log-entity";
import {NotebookEntity} from "../../../../src/common/entities/notebook-entity";

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
