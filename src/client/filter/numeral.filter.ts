import Vue from "vue";
import numeral from "numeral";

export function numeralFilter(input: any, format: string): string {
  return numeral(input).format(format);
}

Vue.filter("numeral", numeralFilter);
