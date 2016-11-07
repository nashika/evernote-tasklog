import Vue = require("vue");
import _ = require("lodash");

Vue.filter("orderObjectBy", function (items: {[key: string]: any}, field: any = "$value", reverse = true) {
  let filtered: Array<{key: string, item: any}> = [];
  _.forEach(items, (item, key) => {
    filtered.push({
      key: key,
      item: item,
    });
  });
  filtered.sort((a: any, b: any) => {
    if (field == "$key")
      return (a.key > b.key) ? -1 : 1;
    if (field == "$value")
      return (a.item > b.item) ? -1 : 1;
    if (typeof field == "string")
      return (a[field] > b[field]) ? -1 : 1;
    if (typeof field == "function")
      return (field(a.item, a.key) > field(b.item, b.key)) ? -1 : 1;
    return 0;
  });
  if (reverse)
    filtered.reverse();
  var results: Array<any> = [];
  _.forEach(filtered, (item: {key: string, item: any}) => {
    var result = item.item;
    result["$key"] = item.key;
    results.push(result);
  });
  return results;
});
