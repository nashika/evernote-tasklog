class NotesController

  constructor: (@$scope) ->
    @$scope.noteSpentTimes = {}
    @$scope.noteProfits = {}
    @$scope.getSpentTime = @_getSpentTime
    @$scope.$watchCollection 'timeLogs', @_onWatchTimeLogs
    @$scope.$watchCollection 'profitLogs', @_onWatchProfitLogs

  _getSpentTime: (noteGuid) =>
    if not @$scope.noteSpentTimes[noteGuid] then return '0m'
    hour = Math.floor(@$scope.noteSpentTimes[noteGuid] / 60)
    minute = @$scope.noteSpentTimes[noteGuid] % 60
    if hour then return hour + 'h' + minute + 'm'
    return minute + 'm'

  _onWatchTimeLogs: (timeLogs) =>
    noteSpentTimes = {}
    for noteGuid, noteTimeLog of timeLogs
      for timeLog_id, timeLog of noteTimeLog
        noteSpentTimes[timeLog.noteGuid] ?= 0
        noteSpentTimes[timeLog.noteGuid] += timeLog.spentTime
    @$scope.noteSpentTimes = noteSpentTimes

  _onWatchProfitLogs: (profitLogs) =>
    console.log 'calc profits'
    noteProfits = {}
    for noteGuid, noteProfitLog of profitLogs
      for profitLog_id, profitLog of noteProfitLog
        noteProfits[profitLog.noteGuid] ?= 0
        noteProfits[profitLog.noteGuid] += profitLog.profit
    @$scope.noteProfits = noteProfits

app.controller 'NotesController', ['$scope', NotesController]
module.exports = NotesController
