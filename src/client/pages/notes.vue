<template lang="pug">
  section#notes-mode.p-3
    b-input-group.mb-2
      b-input-group-addon(slot="left"): i.fa.fa-search
      b-form-input(v-model="filterText", placeholder="Type to Search")
    b-table(bordered, striped, hover, small, responsive, head-variant="dark", foot-clone, foot-variant="default",
      :fields="fields", :items="lodash.values(records)", :filter="filterText")
      template(v-slot:cell(title)="data")
        a(:href="'evernote:///view/' + $myStore.datastore.user.id + '/' + $myStore.datastore.user.shardId + '/' + data.item.guid + '/' + data.item.guid + '/'") {{data.item.title}}
      template(v-slot:cell(updated)="data")
        .text-right {{moment(data.item.updated).format('M/DD HH:mm')}}
      template(v-for="person in existPersons", v-slot:[`cell(person-${person.id})`]="data")
        .text-nowrap(v-if="data.item.persons['$' + person.id].spentTime")
          | {{data.item.persons['$' + person.id].spentTime | spentTime}}
          small ({{Math.round(data.item.persons['$' + person.id].spentTime / data.item.total.spentTime * 100)}}%)
        .text-nowrap(v-if="data.item.persons['$' + person.id].profit")
          | {{data.item.persons['$' + person.id].profit | numeral('0,0')}}
      template(v-slot:cell(total)="data")
        .text-nowrap {{data.item.total.spentTime | spentTime}}
          small(v-if="data.item.total.profit && data.item.total.spentTime")
            | ({{data.item.total.profit / data.item.total.spentTime * 60 | numeral('0,0')}}/h)
        .text-nowrap(v-if="data.item.total.profit")
          | {{data.item.total.profit | numeral('0,0')}}
      template(v-slot:foot()) &nbsp;
      template(v-slot:foot(title)) 合計
      template(v-for="person in existPersons", v-slot:[`foot(person-${person.id})`])
        template(v-if="totalRecord && totalRecord.total")
          .text-nowrap(v-if="totalRecord.persons['$' + person.id].spentTime")
            | {{totalRecord.persons['$' + person.id].spentTime | spentTime}}
            small ({{Math.round(totalRecord.persons['$' + person.id].spentTime / totalRecord.total.spentTime * 100)}}%)
          .text-nowrap(v-if="totalRecord.persons['$' + person.id].profit")
            | {{totalRecord.persons['$' + person.id].profit | numeral('0,0')}}
      template(v-slot:foot(total))
        template(v-if="totalRecord && totalRecord.total")
          .text-nowrap(v-if="totalRecord.total.spentTime")
            | {{totalRecord.total.spentTime | spentTime}}
          .text-nowrap(v-if="totalRecord.total.profit")
            | {{totalRecord.total.profit | numeral('0,0')}}
            small(v-if="totalRecord.total.profit && totalRecord.total.spentTime")
              | ({{totalRecord.total.profit / totalRecord.total.spentTime * 60 | numeral('0,0')}}/h)
    b-modal(id="menu-modal", title="Menu", ok-only, @hidden="reload()")
      .h6 表示する列
      b-form-checkbox(v-model="displayColumns.notebook") ノートブック
      b-form-checkbox(v-model="displayColumns.updated") 更新日
      .h6.mt-3 利益によるフィルター
      b-form-radio-group(v-model="filterProfitType", :options="filterProfitTypeOptions", stacked)
    floating-action-button-component(enableReload, enableFilter, enableMenu, :filterParams="filterParams", @changeFilter="reload($event)")
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import _ from "lodash";

import { BaseComponent } from "~/src/client/components/base.component";
import { NoteEntity } from "~/src/common/entity/note.entity";
import FloatingActionButtonComponent from "~/src/client/components/floating-action-button.vue";
import {
  INoteLogsServiceNoteFilterParams,
  TNotesResult,
  TProfitLogsResult,
  TTimeLogsResult,
} from "~/src/client/service/note-logs.service";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

interface INoteRecord {
  guid: string;
  title: string;
  notebookName: string;
  updated: number;
  persons: {
    [personKey: string]: INoteRecordPersonData;
  };
  total: INoteRecordPersonData;
}

interface INoteRecordPersonData {
  spentTime: number;
  profit: number;
}

type TProfitType = "all" | "withProfit" | "withNoProfit";
type TFieldDefinition = {
  key: string;
  label: string;
  sortable: boolean;
  personId?: number;
};

@Component({
  components: {
    FloatingActionButtonComponent,
  },
})
export default class NotesComponent extends BaseComponent {
  filterText: string = "";
  filterParams: INoteLogsServiceNoteFilterParams = {};
  filterProfitType: TProfitType = "all";
  displayColumns = {
    notebook: true,
    updated: false,
  };

  notes: TNotesResult = {};
  existPersons: AppConfig.IPersonConfig[] = [];
  records: { [guid: string]: INoteRecord } = {};
  totalRecord: INoteRecord | null = null;
  filterProfitTypeOptions: { text: string; value: TProfitType }[] = [
    { text: "Show all notes.", value: "all" },
    { text: "Show notes with profit.", value: "withProfit" },
    { text: "Show notes with no profit.", value: "withNoProfit" },
  ];

  get fields(): TFieldDefinition[] {
    const result: TFieldDefinition[] = [];
    if (this.displayColumns.notebook)
      result.push({
        key: "notebookName",
        label: "ノートブック",
        sortable: true,
      });
    result.push({ key: "title", label: "タイトル", sortable: true });
    if (this.displayColumns.updated)
      result.push({ key: "updated", label: "更新日", sortable: true });
    for (const person of this.existPersons)
      result.push({
        key: "person-" + person.id,
        label: person.name,
        sortable: false,
      });
    result.push({ key: "total", label: "合計", sortable: false });
    return result;
  }

  async mounted(): Promise<void> {
    await super.mounted();
    this.existPersons = [];
    this.filterParams = this.$myService.noteLogs.makeDefaultNoteFilterParams(
      appConfigLoader.app.defaultFilterParams.notes
    );
    await this.reload();
  }

  async reload(
    filterParams: INoteLogsServiceNoteFilterParams | null = null
  ): Promise<void> {
    if (filterParams) this.filterParams = filterParams;
    const noteLogsResult = await this.$myService.noteLogs.getNoteLogs(
      this.filterParams
    );
    if (!noteLogsResult) return;
    this.reloadNotes(noteLogsResult.notes, noteLogsResult.profitLogs);
    this.reloadTimeLogs(noteLogsResult.timeLogs);
    this.reloadProfitLogs(noteLogsResult.profitLogs);
  }

  private reloadNotes(
    notes: TNotesResult | null,
    profitLogs: TProfitLogsResult | null
  ) {
    if (this.filterProfitType === "withProfit")
      this.notes = _.pickBy(
        notes,
        (note: NoteEntity) => profitLogs && !!profitLogs[note.guid]
      );
    else if (this.filterProfitType === "withNoProfit")
      this.notes = _.pickBy(
        notes,
        (note: NoteEntity) => profitLogs && !profitLogs[note.guid]
      );
    else this.notes = notes ?? {};
    this.records = _.mapValues(this.notes, (note) => {
      const record: INoteRecord = {
        guid: note.guid,
        title: note.title,
        notebookName: this.$myStore.datastore.notebooks[note.notebookGuid].name,
        updated: note.updated,
        persons: _(appConfigLoader.app.persons)
          .keyBy((person) => "$" + person.id)
          .mapValues((_person) => ({ spentTime: 0, profit: 0 }))
          .value(),
        total: { spentTime: 0, profit: 0 },
      };
      return record;
    });
    this.totalRecord = {
      guid: "total",
      title: "合計",
      notebookName: "",
      updated: 0,
      persons: _(appConfigLoader.app.persons)
        .keyBy((person) => "$" + person.id)
        .mapValues((_person) => ({ spentTime: 0, profit: 0 }))
        .value(),
      total: { spentTime: 0, profit: 0 },
    };
  }

  private reloadTimeLogs(timeLogs: TTimeLogsResult | null) {
    const personsHash: { [person: string]: boolean } = {};
    for (const noteGuid in timeLogs) {
      const record = this.records[noteGuid];
      if (!record) continue;
      const noteTimeLogs = timeLogs[noteGuid];
      for (const timeLogId in noteTimeLogs) {
        const timeLog = noteTimeLogs[timeLogId];
        const personKey = "$" + timeLog.personId;
        const spentTime = timeLog.spentTime ?? 0;
        record.total.spentTime += spentTime;
        record.persons[personKey].spentTime += spentTime;
        if (this.totalRecord) {
          this.totalRecord.total.spentTime += spentTime;
          this.totalRecord.persons[personKey].spentTime += spentTime;
        }
        if (spentTime > 0) personsHash[timeLog.personId] = true;
      }
    }
    this.existPersons = _.filter(appConfigLoader.app.persons, (person) =>
      _.has(personsHash, person.id)
    );
  }

  private reloadProfitLogs(profitLogs: TProfitLogsResult | null) {
    for (const noteGuid in profitLogs) {
      const record = this.records[noteGuid];
      if (!record) continue;
      const noteProfitLogs = profitLogs[noteGuid];
      for (const profitLogId in noteProfitLogs) {
        const profitLog = noteProfitLogs[profitLogId];
        record.total.profit += profitLog.profit;
        if (this.totalRecord) this.totalRecord.total.profit += profitLog.profit;
      }
      for (const person of this.existPersons) {
        const personKey = "$" + person.id;
        if (record.persons[personKey].spentTime) {
          record.persons[personKey].profit = Math.round(
            (record.total.profit * record.persons[personKey].spentTime) /
              record.total.spentTime
          );
          if (this.totalRecord)
            this.totalRecord.persons[personKey].profit +=
              record.persons[personKey].profit;
        }
      }
    }
  }
}
</script>
