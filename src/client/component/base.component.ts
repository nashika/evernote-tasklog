import Vue = require("vue");
import _ = require("lodash");
import moment = require("moment");
import AppComponent from "./app.component";

export default class BaseComponent extends Vue {

  $root: AppComponent;
  lodash = _;
  moment = moment;

  async created(): Promise<void> {
  }

  async mounted(): Promise<void> {
  }

}
