class NotesController

  constructor: (@$scope) ->
    @$scope.noteSpentTimes = {}
    @$scope.getSpentTime = @_getSpentTime
    @$scope.$watchCollection 'timeLogs', @_onWatchTimeLogs

  _getSpentTime: (noteGuid) =>
    if not @$scope.noteSpentTimes[noteGuid] then return '0m'
    hour = Math.floor(@$scope.noteSpentTimes[noteGuid] / 60)
    minute = @$scope.noteSpentTimes[noteGuid] % 60
    if hour then return hour + 'h' + minute + 'm'
    return minute + 'm'

  _onWatchTimeLogs: (timeLogs) =>
    noteSpentTimes = {}
    for timeLog in timeLogs
      noteSpentTimes[timeLog.noteGuid] ?= 0
      noteSpentTimes[timeLog.noteGuid] += timeLog.spentTime
    @$scope.noteSpentTimes = noteSpentTimes

app.controller 'NotesController', ['$scope', NotesController]
module.exports = NotesController
