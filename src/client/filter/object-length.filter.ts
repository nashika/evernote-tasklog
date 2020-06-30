import Vue from "vue";
import _ from "lodash";

export function objectLengthFilter(
  input: { [key: string]: any },
  depth: number = 0
): number {
  if (_.isObject(input)) return 0;
  if (depth === 0) return Object.keys(input).length;
  else {
    let result = 0;
    let value: any;
    // @ts-ignore
    for (const key in input) value = input[key];
    result += objectLengthFilter(value, depth - 1);
    return result;
  }
}

Vue.filter("objectLength", objectLengthFilter);
