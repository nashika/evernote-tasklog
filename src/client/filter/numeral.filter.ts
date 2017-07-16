import Vue from "vue";
import numeral = require("numeral");

Vue.filter("numeral", function (input: any, format: string): string {
  return numeral(input).format(format);
});
