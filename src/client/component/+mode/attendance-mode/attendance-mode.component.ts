import Component from "vue-class-component";
import moment = require("moment");
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {AttendanceEntity} from "../../../../common/entity/attendance.entity";
import {RequestService} from "../../../service/request.service";
import {container} from "../../../inversify.config";
import {configLoader, IPersonConfig} from "../../../../common/util/config-loader";
import {DatastoreService} from "../../../service/datastore.service";

@Component({})
export default class AttendanceModeComponent extends BaseComponent {

  requestService: RequestService = container.get(RequestService);
  datastoreService: DatastoreService = container.get(DatastoreService);

  attendances: AttendanceEntity[] = [];
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
      label: "Depature",
    },
    rest: {
      label: "Rest",
    },
    action: {
      label: "Action",
    },
  };

  get lastDayOfMonth(): number {
    return moment().year(this.year).month(this.month).endOf("month").date();
  }

  get person(): IPersonConfig {
    return _.find(configLoader.app.persons, {id: this.personId});
  }

  async mounted(): Promise<void> {
    await super.mounted();
    this.personId = this.datastoreService.currentPersonId;
    this.year = moment().year();
    this.month = moment().month();
    await this.reload();
  }

  async reload(): Promise<void> {
    let requestAttendances = await this.requestService.find<AttendanceEntity>(AttendanceEntity, {
      where: {personId: this.personId, year: this.year, month: this.month}
    });
    this.attendances = [];
    for (let i = 1; i <= this.lastDayOfMonth; i++) {
      let attendance = _.find(requestAttendances, {day: i});
      if (!attendance) {
        attendance = new AttendanceEntity();
        attendance.year = this.year;
        attendance.month = this.month;
        attendance.day = i;
        attendance.restMinute = 60;
      }
      this.attendances.push(attendance);
    }
  }

}
