import Vue from "vue";
import _ = require("lodash");
import moment = require("moment");
import numeral = require("numeral");
import AppComponent from "./app.component";

export default class BaseComponent extends Vue {

  $root: AppComponent;
  lodash = _;
  moment = moment;
  numeral = numeral;

  async created(): Promise<void> {
  }

  async mounted(): Promise<void> {
  }

}
