import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {ProfitLogEntity} from "../../../common/entity/profit-log.entity";
import {TimeLogEntity} from "../../../common/entity/time-log.entity";
import {container} from "../../inversify.config";
import {AppComponent} from "../app.component";
import {NoteEntity} from "../../../common/entity/note.entity";

let template = require("./notes-mode.component.jade");

@Component({
  template: template,
  components: {},
  events: {
    "reload": "reload",
  },
})
export class NotesModeComponent extends BaseComponent {

  $root: AppComponent;

  datastoreService: DatastoreService;
  notes: {[guid:string]: NoteEntity};
  notesSpentTimes: {[noteGuid: string]: {[person: string]: number}};
  notesProfits: {[noteGuid: string]: {[person: string]: number}};
  existPersons: string[];

  constructor() {
    super();
  }

  data(): any {
    return _.assign(super.data(), {
      datastoreService: container.get(DatastoreService),
      notes: {},
      notesSpentTimes: {},
      notesProfits: {},
      existPersons: [],
      isReady: false,
    });
  }

  ready(): Promise<void> {
    return super.ready().then(() => {
      this.reload();
    });
  }

  reload(): Promise<void> {
    return this.datastoreService.reload({getContent: true}).then(() => {
      this.notes = this.datastoreService.notes;
      this.reloadTimeLogs(this.datastoreService.timeLogs);
      this.reloadProfitLogs(this.datastoreService.profitLogs);
      return Promise.resolve();
    });
  }

  reloadTimeLogs(timeLogs: {[noteGuid: string]: {[_id: string]: TimeLogEntity}}) {
    this.notesSpentTimes = {};
    let personsHash: {[person: string]: boolean} = {};
    for (var noteGuid in timeLogs) {
      var noteTimeLog = timeLogs[noteGuid];
      for (var timeLogId in noteTimeLog) {
        var timeLog = noteTimeLog[timeLogId];
        if (!this.notesSpentTimes[timeLog.noteGuid])
          this.notesSpentTimes[timeLog.noteGuid] = {$total: 0};
        this.notesSpentTimes[timeLog.noteGuid]["$total"] += timeLog.spentTime;
        if (!this.notesSpentTimes[timeLog.noteGuid][timeLog.person])
          this.notesSpentTimes[timeLog.noteGuid][timeLog.person] = 0;
        this.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
        if (!this.notesSpentTimes["$total"])
          this.notesSpentTimes["$total"] = {$total: 0};
        this.notesSpentTimes["$total"]["$total"] += timeLog.spentTime;
        if (!this.notesSpentTimes["$total"][timeLog.person])
          this.notesSpentTimes["$total"][timeLog.person] = 0;
        this.notesSpentTimes["$total"][timeLog.person] += timeLog.spentTime;
        if (timeLog.spentTime > 0)
          personsHash[timeLog.person] = true;
      }
    }
    this.existPersons = Object.keys(personsHash);
  }

  reloadProfitLogs(profitLogs: {[noteGuid: string]: {[person: string]: ProfitLogEntity}}) {
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
        if (!this.notesSpentTimes[noteGuid] || !this.notesSpentTimes[noteGuid][person] || !this.notesSpentTimes[noteGuid]["$total"])
          this.notesProfits[noteGuid][person] = null;
        else
          this.notesProfits[noteGuid][person] = Math.round(this.notesProfits[noteGuid]["$total"] * this.notesSpentTimes[noteGuid][person] / this.notesSpentTimes[noteGuid]["$total"]);
        if (!this.notesProfits["$total"][person])
          this.notesProfits["$total"][person] = 0;
        this.notesProfits["$total"][person] += this.notesProfits[noteGuid][person];
      }
    }
  };

}
