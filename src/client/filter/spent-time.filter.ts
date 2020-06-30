import Vue from "vue";

export function spentTimeFilter(input: any): string {
  if (input === undefined) return "";
  if (!input) return "0m";
  const hour = Math.floor(input / 60);
  const minute = input % 60;
  if (hour) return hour + "h" + minute + "m";
  return minute + "m";
}

Vue.filter("spentTime", spentTimeFilter);
