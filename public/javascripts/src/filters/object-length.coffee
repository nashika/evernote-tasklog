objectLength = ->
  _objectLength = (input, depth = 0) ->
    if not angular.isObject(input)
      throw Error("Usage of non-objects with objectLength filter.")
    if depth is 0
      return Object.keys(input).length
    else
      result = 0
      for key, value of input
        result += _objectLength(value, depth - 1)
      return result
  return _objectLength

app.filter 'objectLength', objectLength
module.exports = objectLength
