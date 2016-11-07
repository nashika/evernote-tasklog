import Vue = require("vue");
import _ = require("lodash");
import moment = require("moment");
import {LoDashStatic} from "lodash";
import MomentStatic = moment.MomentStatic;

export class BaseComponent extends Vue {

  lodash: LoDashStatic;
  moment: MomentStatic;

  data(): any {
    return {
      lodash: _,
      moment: moment,
    };
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

}
