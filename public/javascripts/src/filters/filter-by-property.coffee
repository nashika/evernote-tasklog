checkItemMatches = (item, props) =>
  itemMatches = false;
  for prop, text of props
    text = text.toLowerCase()
    if (item[prop].toString().toLowerCase().indexOf(text) isnt -1)
      itemMatches = true
      break
  return itemMatches

filterByProperty = ->
  return (items, props) ->
    out = [];
    if angular.isArray(items)
      for item in items
        itemMatches = checkItemMatches(item, props)
        out.push item if itemMatches
    else if angular.isObject(items)
      for key, item of items
        itemMatches = checkItemMatches(item, props)
        out.push item if itemMatches
    else
      out = items
    return out;

app.filter 'filterByProperty', filterByProperty
module.exports = filterByProperty
