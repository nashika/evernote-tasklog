import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {DatastoreService} from "../../../service/datastore.service";
import {ProfitLogEntity} from "../../../../common/entity/profit-log.entity";
import {TimeLogEntity} from "../../../../common/entity/time-log.entity";
import {container} from "../../../inversify.config";
import {NoteEntity} from "../../../../common/entity/note.entity";
import {configLoader, IPersonConfig} from "../../../../common/util/config-loader";

@Component({})
export default class NotesModeComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  notes: { [guid: string]: NoteEntity } = {};
  notesSpentTimes: { [noteGuid: string]: { [person: string]: number } } = {};
  notesProfits: { [noteGuid: string]: { [person: string]: number } } = {};
  existPersons: IPersonConfig[];

  constructor() {
    super();
    this.existPersons = [];
  }

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    let noteLogsResult = await this.datastoreService.getNoteLogs({getContent: true});
    this.notes = noteLogsResult.notes;
    this.reloadTimeLogs(noteLogsResult.timeLogs);
    this.reloadProfitLogs(noteLogsResult.profitLogs);
  }

  private reloadTimeLogs(timeLogs: { [noteGuid: string]: { [_id: string]: TimeLogEntity } }) {
    this.notesSpentTimes = {};
    let personsHash: { [person: string]: boolean } = {};
    for (var noteGuid in timeLogs) {
      var noteTimeLog = timeLogs[noteGuid];
      for (var timeLogId in noteTimeLog) {
        var timeLog = noteTimeLog[timeLogId];
        if (!this.notesSpentTimes[timeLog.noteGuid])
          this.notesSpentTimes[timeLog.noteGuid] = {$total: 0};
        this.notesSpentTimes[timeLog.noteGuid]["$total"] += timeLog.spentTime;
        if (!this.notesSpentTimes[timeLog.noteGuid][timeLog.personId])
          this.notesSpentTimes[timeLog.noteGuid][timeLog.personId] = 0;
        this.notesSpentTimes[timeLog.noteGuid][timeLog.personId] += timeLog.spentTime;
        if (!this.notesSpentTimes["$total"])
          this.notesSpentTimes["$total"] = {$total: 0};
        this.notesSpentTimes["$total"]["$total"] += timeLog.spentTime;
        if (!this.notesSpentTimes["$total"][timeLog.personId])
          this.notesSpentTimes["$total"][timeLog.personId] = 0;
        this.notesSpentTimes["$total"][timeLog.personId] += timeLog.spentTime;
        if (timeLog.spentTime > 0)
          personsHash[timeLog.personId] = true;
      }
    }
    this.existPersons = _.filter(configLoader.app.persons, person => _.has(personsHash, person.id));
  }

  private reloadProfitLogs(profitLogs: { [noteGuid: string]: { [person: string]: ProfitLogEntity } }) {
    this.notesProfits = {};
    for (var noteGuid in profitLogs) {
      var noteProfitLog = profitLogs[noteGuid];
      for (var profitLogId in noteProfitLog) {
        var profitLog = noteProfitLog[profitLogId];
        if (!this.notesProfits[profitLog.noteGuid])
          this.notesProfits[profitLog.noteGuid] = {$total: 0};
        this.notesProfits[profitLog.noteGuid]["$total"] += profitLog.profit;
        if (!this.notesProfits["$total"])
          this.notesProfits["$total"] = {$total: 0};
        this.notesProfits["$total"]["$total"] += profitLog.profit;
      }
      for (var person of this.existPersons) {
        if (!this.notesSpentTimes[noteGuid] || !this.notesSpentTimes[noteGuid][person.id] || !this.notesSpentTimes[noteGuid]["$total"])
          this.notesProfits[noteGuid][person.id] = null;
        else
          this.notesProfits[noteGuid][person.id] = Math.round(this.notesProfits[noteGuid]["$total"] * this.notesSpentTimes[noteGuid][person.id] / this.notesSpentTimes[noteGuid]["$total"]);
        if (!this.notesProfits["$total"][person.id])
          this.notesProfits["$total"][person.id] = 0;
        this.notesProfits["$total"][person.id] += this.notesProfits[noteGuid][person.id];
      }
    }
  }

}
