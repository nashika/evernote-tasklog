<template lang="pug">
section#attendance-mode
  .container
    .row.my-2
      .col-sm-4
        .form-group
          b aa {{$myStore.datastore.reloadFlag}} bb
          label {{$t('common.person')}}
          b-form-select(v-model="personId", :options="persons", value-field="id", text-field="name")
      .col-sm-4
        .form-group
          label {{$t('common.year')}}
          b-form-input(v-model="strYear", type="number", min="2000", max="2099", step="1", @change="reload()")
      .col-sm-4
        .form-group
          label {{$t('common.month')}}
          b-form-input(v-model="strMonth", type="number", min="1", max="12", step="1", @change="reload()")
    .row.my-2(v-if="todayAttendance && personId == $datastoreService.$vm.currentPersonId && year == moment().year() && month == moment().month() + 1")
      .col-sm-6
        b-button(variant="primary", size="lg", block, :disabled="!!todayAttendance.arrivalTime", @click="arrival()") #[i.fa.fa-sign-in] {{$t('common.arrival')}}
      .col-sm-6
        b-button(variant="primary", size="lg", block, :disabled="!todayAttendance.arrivalTime || !!todayAttendance.departureTime", @click="departure()") #[i.fa.fa-sign-out] {{$t('common.departure')}}
    b-table(bordered, small, striped, hover, responsive, head-variant="dark", :fields="fields", :items="attendances")
      template(v-slot:cell(day)="data")
        | {{data.item.day}} ({{moment({year: data.item.year, month: data.item.month - 1, day: data.item.day}).format('ddd')}})
      template(v-slot:cell(arrival)="data")
        attendance-time-picker-component(v-model="data.item.arrivalTime", @change="changeRow(data.index)")
      template(v-slot:cell(departure)="data")
        attendance-time-picker-component(v-model="data.item.departureTime", @change="changeRow(data.index)")
      template(v-slot:cell(rest)="data")
        attendance-time-picker-component(v-model="data.item.restTime", @change="changeRow(data.index)")
      template(v-slot:cell(remarks)="data")
        b-form-input(size="sm", v-model="data.item.remarks", @change="changeRow(data.index)")
      template(v-slot:cell(action)="data")
        b-button(variant="primary", size="sm", :disabled="!updateFlags[data.index]", @click="save(data.item)") {{$t('common.update')}}
        b-button(variant="danger", size="sm", :disabled="!createFlags[data.index]", @click="remove(data.item)") {{$t('common.delete')}}
    .my-3.text-right
      b-button(variant="secondary", size="sm", @click="exportCsv()") Export CSV
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import moment from "moment";
import _ from "lodash";
import Vue from "vue";

import BaseComponent from "../components/base.component";
import AttendanceEntity from "../../common/entity/attendance.entity";
import configLoader from "../../common/util/config-loader";
import { assertIsDefined } from "~/src/common/util/assert";
import AttendanceTimePickerComponent from "~/src/client/components/attendance-time-picker.component.vue";

@Component({
  components: {
    AttendanceTimePickerComponent,
  },
})
export default class AttendancePageComponent extends BaseComponent {
  attendances: AttendanceEntity[] = [];
  todayAttendance: AttendanceEntity | null = null;
  updateFlags: boolean[] = [];
  createFlags: boolean[] = [];
  personId: number = 0;
  year: number = 0;
  month: number = 0;

  fields!: Array<Object>;

  get strYear(): string {
    return _.toString(this.year);
  }

  set strYear(value: string) {
    this.year = _.toInteger(value);
  }

  get strMonth(): string {
    return _.toString(this.month);
  }

  set strMonth(value: string) {
    this.month = _.toInteger(value);
  }

  get lastDayOfMonth(): number {
    return moment()
      .year(this.year)
      .month(this.month - 1)
      .endOf("month")
      .date();
  }

  get persons(): AppConfig.IPersonConfig[] {
    return configLoader.app.persons;
  }

  get person(): AppConfig.IPersonConfig | undefined {
    return _.find(this.persons, { id: this.personId });
  }

  async beforeCreate(): Promise<void> {
    this.fields = [
      {
        key: "day",
        label: this.$t("common.day"),
      },
      {
        key: "arrival",
        label: this.$t("common.arrival"),
      },
      {
        key: "departure",
        label: this.$t("common.departure"),
      },
      {
        key: "rest",
        label: this.$t("common.rest"),
      },
      {
        key: "remarks",
        label: this.$t("common.remarks"),
      },
      {
        key: "action",
        label: this.$t("common.action"),
      },
    ];
  }

  async mounted(): Promise<void> {
    await super.mounted();
    this.$store.subscribe(async (mutation, _state) => {
      if (mutation.type === "datastore/startReload") await this.reload();
    });
    await this.reload();
  }

  async reload(): Promise<void> {
    if (!this.personId)
      this.personId = this.$datastoreService.$vm.currentPersonId;
    if (!this.year) this.year = moment().year();
    if (!this.month) this.month = moment().month() + 1;
    this.attendances = [];
    this.createFlags = [];
    this.todayAttendance = null;
    this.$progressService.open(1);
    this.$progressService.next("Request from server.");
    const requestAttendances = await this.$requestService.find<
      AttendanceEntity
    >(AttendanceEntity, {
      where: { personId: this.personId, year: this.year, month: this.month },
    });
    for (let i = 1; i <= this.lastDayOfMonth; i++) {
      let attendance = _.find(requestAttendances, { day: i });
      this.createFlags.push(!!attendance);
      if (!attendance) {
        attendance = new AttendanceEntity();
        attendance.year = this.year;
        attendance.month = this.month;
        attendance.day = i;
        attendance.arrivalTime = null;
        attendance.departureTime = null;
        attendance.restTime = 60;
        attendance.remarks = "";
      }
      if (
        moment({ year: this.year, month: this.month - 1, date: i }).day() === 6
      )
        Vue.set(attendance, "_rowVariant", "info");
      if (
        moment({ year: this.year, month: this.month - 1, date: i }).day() === 0
      )
        Vue.set(attendance, "_rowVariant", "danger");
      if (
        moment().year() === this.year &&
        moment().month() + 1 === this.month &&
        moment().date() === i
      ) {
        Vue.set(attendance, "_rowVariant", "active");
        this.todayAttendance = attendance;
      }
      this.attendances.push(attendance);
    }
    this.updateFlags = _.fill(Array(this.lastDayOfMonth - 1), false);
    this.$progressService.close();
  }

  async arrival(): Promise<void> {
    assertIsDefined(this.todayAttendance);
    this.todayAttendance.arrivalTime = this.currentTime();
    await this.save(this.todayAttendance);
  }

  async departure(): Promise<void> {
    assertIsDefined(this.todayAttendance);
    this.todayAttendance.departureTime = this.currentTime();
    await this.save(this.todayAttendance);
  }

  private currentTime(): number {
    return moment().hour() * 60 + moment().minute();
  }

  changeRow(index: number): void {
    Vue.set(this.attendances[index], "_rowVariant", "success");
    Vue.set(this.updateFlags, index, true);
  }

  async save(attendance: AttendanceEntity): Promise<void> {
    attendance.personId = this.personId;
    attendance.year = this.year;
    attendance.month = this.month;
    await this.$requestService.save(AttendanceEntity, attendance);
    await this.reload();
  }

  async remove(attendance: AttendanceEntity): Promise<void> {
    await this.$requestService.remove(AttendanceEntity, attendance.id);
    await this.reload();
  }

  exportCsv(): void {
    let content: string = "Day,Arrival,Departure,Rest,Remarks\n";
    for (const attendance of this.attendances)
      content += `${attendance.day},${this.timeToStr(
        attendance.arrivalTime
      )},${this.timeToStr(attendance.departureTime)},${this.timeToStr(
        attendance.restTime
      )},${attendance.remarks}\n`;
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, content], { type: "text/csv" });
    const a = document.createElement("a");
    a.download = `attendances_${this.person?.name}-${this.year}-${
      this.month
    }_${moment().format("YYYYMMDDHHmmss")}.csv`;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  private timeToStr(time: number | null): string {
    if (!_.isNumber(time)) return "";
    return `${Math.floor(time / 60)}:${time % 60}`;
  }
}
</script>
