import _ from "lodash";
import Vue from "vue";

const checkItemMatches = (
  item: { [key: string]: any },
  props: { [key: string]: string }
): boolean => {
  for (const prop in props) {
    let text: string = props[prop];
    text = text.toLowerCase();
    if (item[prop].toString().toLowerCase().includes(text)) {
      return true;
    }
  }
  return false;
};

export function filterByPropertyFilter(
  items:
    | Array<{ [property: string]: any }>
    | { [key: string]: { [property: string]: any } },
  props: { [property: string]: string }
): any {
  let arrItems: Array<{ [property: string]: any }> = [];
  if (_.isArray(items)) arrItems = <Array<{ [property: string]: any }>>items;
  else if (_.isObject(items))
    _.forEach(items, (item) => {
      arrItems.push(item);
    });
  else return [];
  const results: Array<{ [key: string]: string }> = [];
  for (const item of arrItems)
    if (checkItemMatches(item, props)) results.push(item);
  return results;
}

Vue.filter("filterByProperty", filterByPropertyFilter);
