import Vue from "vue";
import _ = require("lodash");

var objectLength = function (input: {[key: string]: any}, depth: number = 0): number {
  if (_.isObject(input))
    return 0;
  if (depth == 0)
    return Object.keys(input).length;
  else {
    var result = 0;
    for (var key in input)
      var value: any = input[key]
    result += objectLength(value, depth - 1);
    return result;
  }
};

Vue.filter("objectLength", objectLength);
