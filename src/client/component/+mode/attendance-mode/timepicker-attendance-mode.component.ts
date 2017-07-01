import Component from "vue-class-component";

import BaseComponent from "../../base.component";
import * as _ from "lodash";

@Component({
  props: {
    value: Number,
  },
})
export default class TimepickerAttendanceModeComponent extends BaseComponent {

  value: number;

  hour: string = "";
  minute: string = "";

  async mounted(): Promise<void> {
    if (_.isNumber(this.value)) {
      this.hour = String(Math.floor(this.value / 60));
      this.minute = String(this.value % 60);
    }
  }

  change(): void {
    let value: number = null;
    if (this.hour && this.minute)
      value = _.toInteger(this.hour) * 60 + _.toInteger(this.minute);
    this.$emit("input", value);
    this.$emit("change");
  }

}
