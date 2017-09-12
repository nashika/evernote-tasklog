import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {
  DatastoreService, IDatastoreServiceNoteFilterParams, TNotesResult,
  TProfitLogsResult, TTimeLogsResult
} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";
import {NoteEntity} from "../../../../common/entity/note.entity";
import {configLoader} from "../../../../common/util/config-loader";
import {i18n} from "../../../i18n";

interface INoteRecord {
  guid: string;
  title: string;
  notebookName: string;
  updated: number;
  persons: {
    [personKey: string]: INoteRecordPersonData;
  }
  total: INoteRecordPersonData;
}

interface INoteRecordPersonData {
  spentTime: number;
  profit: number;
}

@Component({})
export default class NotesModeComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  filterText: string = "";
  filterParams: IDatastoreServiceNoteFilterParams = {};
  filterProfitType: "" | "withProfit" | "withNoProfit" = "";
  displayColumns = {
    notebook: true,
    updated: false,
  };
  notes: TNotesResult = {};
  existPersons: config.IPersonConfig[] = [];
  records: {[guid: string]: INoteRecord} = {};
  totalRecord: INoteRecord = <any>{};

  filterProfitTypeOptions = [
    {text: "Show all notes.", value: ""},
    {text: "Show notes with profit.", value: "withProfit"},
    {text: "Show notes with no profit.", value: "withNoProfit"},
  ];

  constructor() {
    super();
    this.existPersons = [];
  }

  get fields(): Object {
    let result: any = {};
    if (this.displayColumns.notebook) result.notebookName = {label: i18n.t("common.notebook"), sortable: true};
    result["title"] = {label: i18n.t("common.title"), sortable: true};
    if (this.displayColumns.updated) result.updated = {label: i18n.t("common.updated"), sortable: true};
    for (let person of this.existPersons)
      result["person-" + person.id] = {label: person.name, personId: person.id, sortable: true};
    result["total"] = {label: i18n.t("common.total"), sortable: true};
    return result;
  }

  async mounted(): Promise<void> {
    await super.mounted();
    this.filterParams = this.datastoreService.makeDefaultNoteFilterParams(configLoader.app.defaultFilterParams.notes);
    await this.reload();
  }

  async reload(filterParams: IDatastoreServiceNoteFilterParams = null): Promise<void> {
    if (filterParams) this.filterParams = filterParams;
    let noteLogsResult = await this.datastoreService.getNoteLogs(this.filterParams);
    if (!noteLogsResult) return;
    this.reloadNotes(noteLogsResult.notes, noteLogsResult.profitLogs);
    this.reloadTimeLogs(noteLogsResult.timeLogs);
    this.reloadProfitLogs(noteLogsResult.profitLogs);
  }

  private reloadNotes(notes: TNotesResult, profitLogs: TProfitLogsResult) {
    if (this.filterProfitType == "withProfit")
      this.notes = _.pickBy(notes, (note: NoteEntity) => !!profitLogs[note.guid]);
    else if (this.filterProfitType == "withNoProfit")
      this.notes = _.pickBy(notes, (note: NoteEntity) => !profitLogs[note.guid]);
    else
      this.notes = notes;
    this.records = _.mapValues(this.notes, note => {
      let record: INoteRecord = {
        guid: note.guid,
        title: note.title,
        notebookName: this.datastoreService.$vm.notebooks[note.notebookGuid].name,
        updated: note.updated,
        persons: _(configLoader.app.persons).keyBy(person => "$" + person.id).mapValues(_person => ({spentTime: 0, profit: 0})).value(),
        total: {spentTime: 0, profit: 0},
      };
      return record;
    });
    this.totalRecord = {
      guid: "total",
      title: "Total",
      notebookName: "",
      updated: 0,
      persons: _(configLoader.app.persons).keyBy(person => "$" + person.id).mapValues(_person => ({spentTime: 0, profit: 0})).value(),
      total: {spentTime: 0, profit: 0},
    };
  }

  private reloadTimeLogs(timeLogs: TTimeLogsResult) {
    let personsHash: { [person: string]: boolean } = {};
    for (let noteGuid in timeLogs) {
      let record = this.records[noteGuid];
      if (!record) continue;
      let noteTimeLogs = timeLogs[noteGuid];
      for (let timeLogId in noteTimeLogs) {
        let timeLog = noteTimeLogs[timeLogId];
        let personKey = "$" + timeLog.personId;
        record.total.spentTime += timeLog.spentTime;
        record.persons[personKey].spentTime += timeLog.spentTime;
        this.totalRecord.total.spentTime += timeLog.spentTime;
        this.totalRecord.persons[personKey].spentTime += timeLog.spentTime;
        if (timeLog.spentTime > 0)
          personsHash[timeLog.personId] = true;
      }
    }
    this.existPersons = _.filter(configLoader.app.persons, person => _.has(personsHash, person.id));
  }

  private reloadProfitLogs(profitLogs: TProfitLogsResult) {
    for (let noteGuid in profitLogs) {
      let record = this.records[noteGuid];
      if (!record) continue;
      let noteProfitLogs = profitLogs[noteGuid];
      for (let profitLogId in noteProfitLogs) {
        let profitLog = noteProfitLogs[profitLogId];
        record.total.profit += profitLog.profit;
        this.totalRecord.total.profit += profitLog.profit;
      }
      for (let person of this.existPersons) {
        let personKey = "$" + person.id;
        if (record.persons[personKey].spentTime) {
          record.persons[personKey].profit = Math.round(record.total.profit * record.persons[personKey].spentTime / record.total.spentTime);
          this.totalRecord.persons[personKey].profit += record.persons[personKey].profit;
        }
      }
    }
  }

}
