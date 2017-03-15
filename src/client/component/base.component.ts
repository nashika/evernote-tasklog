import Vue = require("vue");
import _ = require("lodash");
import moment = require("moment");
import {LoDashStatic} from "lodash";

export class BaseComponent extends Vue {

  lodash: LoDashStatic;
  moment: moment.Moment;

  data(): any {
    return {
      lodash: _,
      moment: moment,
    };
  }

  async created(): Promise<void> {
  }

  async mounted(): Promise<void> {
  }

}
