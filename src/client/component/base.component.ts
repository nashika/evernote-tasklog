import Vue = require("vue");
import _ = require("lodash");
import moment = require("moment");

export class BaseComponent extends Vue {

  lodash = _;
  moment = moment;

  async created(): Promise<void> {
  }

  async mounted(): Promise<void> {
  }

}
