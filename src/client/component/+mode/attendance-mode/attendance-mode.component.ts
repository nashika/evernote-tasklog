import Component from "vue-class-component";
import moment = require("moment");
import * as _ from "lodash";
import Vue from "vue";

import BaseComponent from "../../base.component";
import {AttendanceEntity} from "../../../../common/entity/attendance.entity";
import {RequestService} from "../../../service/request.service";
import {container} from "../../../inversify.config";
import {configLoader, IPersonConfig} from "../../../../common/util/config-loader";
import {DatastoreService} from "../../../service/datastore.service";
import {ProgressService} from "../../../service/progress.service";

@Component({
  components: {
    "app-timepicker-attendance-mode": require("./timepicker-attendance-mode.component.vue").default,
  },
  watch: {
    "personId": "reload",
  },
})
export default class AttendanceModeComponent extends BaseComponent {

  requestService: RequestService = container.get(RequestService);
  datastoreService: DatastoreService = container.get(DatastoreService);
  progressService: ProgressService = container.get(ProgressService);

  attendances: AttendanceEntity[] = [];
  todayAttendance: AttendanceEntity = null;
  updateFlags: boolean[] = [];
  createFlags: boolean[] = [];
  personId: number = 0;
  year: number = 0;
  month: number = 0;

  fields = {
    day: {
      label: "Day",
    },
    arrival: {
      label: "Arrival",
    },
    departure: {
      label: "Departure",
    },
    rest: {
      label: "Rest",
    },
    remarks: {
      label: "Remarks",
    },
    action: {
      label: "Action",
    },
  };

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
    return moment().year(this.year).month(this.month - 1).endOf("month").date();
  }

  get persons(): IPersonConfig[] {
    return configLoader.app.persons;
  }

  get person(): IPersonConfig {
    return _.find(this.persons, {id: this.personId});
  }

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    if (!this.personId) this.personId = this.datastoreService.$vm.currentPersonId;
    if (!this.year) this.year = moment().year();
    if (!this.month) this.month = moment().month() + 1;
    this.attendances = [];
    this.createFlags = [];
    this.todayAttendance = null;
    this.progressService.open(1);
    this.progressService.next("Request from server.");
    let requestAttendances = await this.requestService.find<AttendanceEntity>(AttendanceEntity, {
      where: {personId: this.personId, year: this.year, month: this.month}
    });
    for (let i = 1; i <= this.lastDayOfMonth; i++) {
      let attendance = _.find(requestAttendances, {day: i});
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
      if (moment({year: this.year, month: this.month - 1, date: i}).day() == 6)
        Vue.set(attendance, "_rowVariant", "info");
      if (moment({year: this.year, month: this.month - 1, date: i}).day() == 0)
        Vue.set(attendance, "_rowVariant", "danger");
      if (moment().year() == this.year && moment().month() + 1 == this.month && moment().date() == i) {
        Vue.set(attendance, "_rowVariant", "active");
        this.todayAttendance = attendance;
      }
      this.attendances.push(attendance);
    }
    this.updateFlags = _.fill(Array(this.lastDayOfMonth - 1), false);
    this.progressService.close();
  }

  async arrival(): Promise<void> {
    this.todayAttendance.arrivalTime = this.currentTime();
    await this.save(this.todayAttendance);
  }

  async departure(): Promise<void> {
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
    await this.requestService.save(AttendanceEntity, attendance);
    await this.reload();
  }

  async remove(attendance: AttendanceEntity): Promise<void> {
    await this.requestService.remove(AttendanceEntity, attendance.id);
    await this.reload();
  }

  exportCsv(): void {
    let content: string = "Day,Arrival,Departure,Rest,Remarks\n";
    for (let attendance of this.attendances)
      content += `${attendance.day},${this.timeToStr(attendance.arrivalTime)},${this.timeToStr(attendance.departureTime)},${this.timeToStr(attendance.restTime)},${attendance.remarks}\n`;
    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([bom, content], {type: "text/csv"});
    let a = document.createElement("a");
    a.download = `attendances_${this.person.name}-${this.year}-${this.month}_${moment().format("YYYYMMDDHHmmss")}.csv`;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  private timeToStr(time: number): string {
    if (!_.isNumber(time)) return "";
    return `${Math.floor(time / 60)}:${time % 60}`;
  }

}
