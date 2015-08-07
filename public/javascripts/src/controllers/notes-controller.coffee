class NotesController

  constructor: (@$scope) ->
    @$scope.noteSpentTimes = {}
    @$scope.notePersonSpentTimes = {}
    @$scope.noteProfits = {}
    @$scope.existPersons = {}
    @$scope.getSpentTime = @_getSpentTime
    @$scope.getProfit = @_getProfit
    @$scope.$watchCollection 'timeLogs', @_onWatchTimeLogs
    @$scope.$watchCollection 'profitLogs', @_onWatchProfitLogs

  _getSpentTime: (noteGuid, person = null) =>
    if person
      spentTime = @$scope.notePersonSpentTimes[noteGuid]?[person]
    else
      spentTime = @$scope.noteSpentTimes[noteGuid]
    if spentTime is undefined then return ''
    if not spentTime then return '0m'
    hour = Math.floor(spentTime / 60)
    minute = spentTime % 60
    if hour then return hour + 'h' + minute + 'm'
    return minute + 'm'

  _getProfit: (noteGuid, person = null) =>
    if not @$scope.noteProfits[noteGuid] then return null
    if not @$scope.notePersonSpentTimes[noteGuid]?[person] then return null
    if not @$scope.noteSpentTimes[noteGuid] then return null
    return @$scope.noteProfits[noteGuid] * @$scope.notePersonSpentTimes[noteGuid][person] / @$scope.noteSpentTimes[noteGuid]

  _onWatchTimeLogs: (timeLogs) =>
    @$scope.noteSpentTimes = {}
    @$scope.notePersonSpentTimes = {}
    persons = {}
    for noteGuid, noteTimeLog of timeLogs
      for timeLog_id, timeLog of noteTimeLog
        @$scope.noteSpentTimes[timeLog.noteGuid] ?= 0
        @$scope.noteSpentTimes[timeLog.noteGuid] += timeLog.spentTime
        @$scope.notePersonSpentTimes[timeLog.noteGuid] ?= {}
        @$scope.notePersonSpentTimes[timeLog.noteGuid][timeLog.person] ?= 0
        @$scope.notePersonSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime
        persons[timeLog.person] = true if timeLog.spentTime > 0
    @$scope.existPersons = Object.keys(persons)

  _onWatchProfitLogs: (profitLogs) =>
    @$scope.noteProfits = {}
    for noteGuid, noteProfitLog of profitLogs
      for profitLog_id, profitLog of noteProfitLog
        @$scope.noteProfits[profitLog.noteGuid] ?= 0
        @$scope.noteProfits[profitLog.noteGuid] += profitLog.profit

app.controller 'NotesController', ['$scope', NotesController]
module.exports = NotesController
