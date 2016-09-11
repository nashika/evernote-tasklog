import {NoteEntity} from "../../common/entity/note-entity";
import {UserEntity} from "../../common/entity/user-entity";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {BaseService} from "./base-service";

export class DataStoreService extends BaseService {

  user: UserEntity;
  persons: Object[];
  notebooks: {[guid: string]: NotebookEntity};
  stacks: string[];
  notes: {[guid: string]: NoteEntity};
  timeLogs: {[noteGuid: string]: {[_id: string]: TimeLogEntity}};
  profitLogs: {[noteGuid: string]: {[_id: string]: ProfitLogEntity}};
  settings: {[key: string]: any};

  constructor() {
    super();
    this.user = null;
    this.persons = [];
    this.notebooks = {};
    this.stacks = [];
    this.notes = {};
    this.timeLogs = {};
    this.profitLogs = {};
    this.settings = {};
  }

}
