import _ = require("lodash");
import Vue from "vue";

var checkItemMatches = (item: {[key: string]: any}, props: {[key: string]: string}): boolean => {
  for (var prop in props) {
    var text: string = props[prop];
    text = text.toLowerCase();
    if (item[prop].toString().toLowerCase().indexOf(text) != -1) {
      return true
    }
  }
  return false;
};

Vue.filter("filterByProperty", function (items: Array<{[property: string]: any}>|{[key: string]: {[property: string]: any}}, props: {[property: string]: string}): any {
  var arrItems: Array<{[property: string]: any}> = [];
  if (_.isArray(items))
    arrItems = <Array<{[property: string]: any}>>items;
  else if (_.isObject(items))
    _.forEach(items, item => {
      arrItems.push(item);
    });
  else
    return [];
  var results: Array<{[key: string]: string}> = [];
  for (var item of arrItems)
    if (checkItemMatches(item, props))
      results.push(item);
  return results;
});
