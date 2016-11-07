import Vue = require("vue");

Vue.filter("spentTime", function (input:any):string {
  if (input === undefined) return "";
  if (!input) return "0m";
  var hour = Math.floor(input / 60);
  var minute = input % 60;
  if (hour) return hour + "h" + minute + "m";
  return minute + "m";
});
