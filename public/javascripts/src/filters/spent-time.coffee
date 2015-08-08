spentTime = ->
  return (input) ->
    if input is undefined then return ''
    if not input then return '0m'
    hour = Math.floor(input / 60)
    minute = input % 60
    if hour then return hour + 'h' + minute + 'm'
    return minute + 'm'

app.filter 'spentTime', spentTime
module.exports = spentTime
