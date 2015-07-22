app.filter 'orderObjectBy', ->
  return (items, field = '$value', reverse = true) ->
    filtered = []
    angular.forEach items, (item, key) ->
      filtered.push {
        key: key
        item: item
      }
    filtered.sort (a, b) ->
      if field is '$key'
        return if a.key > b.key then -1 else 1
      if field is '$value'
        return if a.item > b.item then -1 else 1
      if typeof field is 'string'
        return if a[field] > b[field] then -1 else 1
      if typeof field is 'function'
        return if field(a.item, a.key) > field(b.item, b.key) then -1 else 1
    if reverse
      filtered.reverse()
    results = []
    angular.forEach filtered, (item) ->
      result = item.item
      result['$key'] = item.key
      results.push result
    return results
