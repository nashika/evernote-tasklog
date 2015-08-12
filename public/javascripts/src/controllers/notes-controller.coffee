class NotesController

  constructor: (@$scope, @dataStore) ->
    @$scope.dataStore = @dataStore
    @$scope.notesSpentTimes = {}
    @$scope.notesProfits = {}
    @$scope.existPersons = []
    @$scope.$watchCollection 'dataStore.timeLogs', @_onWatchTimeLogs
    @$scope.$watchCollection 'dataStore.profitLogs', @_onWatchProfitLogs

  _onWatchTimeLogs: (timeLogs) =>
    @$scope.notesSpentTimes = {}
    persons = {}
    for noteGuid, noteTimeLog of timeLogs
      for timeLog_id, timeLog of noteTimeLog
        @$scope.notesSpentTimes[timeLog.noteGuid] ?= {}
        @$scope.notesSpentTimes[timeLog.noteGuid]['$total'] ?= 0
        @$scope.notesSpentTimes[timeLog.noteGuid]['$total'] += timeLog.spentTime
        @$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] ?= 0
        @$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime
        @$scope.notesSpentTimes['$total'] ?= {}
        @$scope.notesSpentTimes['$total']['$total'] ?= 0
        @$scope.notesSpentTimes['$total']['$total'] += timeLog.spentTime
        @$scope.notesSpentTimes['$total'][timeLog.person] ?= 0
        @$scope.notesSpentTimes['$total'][timeLog.person] += timeLog.spentTime
        persons[timeLog.person] = true if timeLog.spentTime > 0
    @$scope.existPersons = Object.keys(persons)

  _onWatchProfitLogs: (profitLogs) =>
    calc = (noteGuid, person) =>
      if not @$scope.notesSpentTimes[noteGuid]?[person] then return null
      if not @$scope.notesSpentTimes[noteGuid]?['$total'] then return null
      return Math.round(@$scope.notesProfits[noteGuid]['$total'] * @$scope.notesSpentTimes[noteGuid][person] / @$scope.notesSpentTimes[noteGuid]['$total'])
    @$scope.notesProfits = {}
    for noteGuid, noteProfitLog of profitLogs
      for profitLog_id, profitLog of noteProfitLog
        @$scope.notesProfits[profitLog.noteGuid] ?= {}
        @$scope.notesProfits[profitLog.noteGuid]['$total'] ?= 0
        @$scope.notesProfits[profitLog.noteGuid]['$total'] += profitLog.profit
        @$scope.notesProfits['$total'] ?= {}
        @$scope.notesProfits['$total']['$total'] ?= 0
        @$scope.notesProfits['$total']['$total'] += profitLog.profit
      for person in @$scope.existPersons
        @$scope.notesProfits[noteGuid][person] = calc(noteGuid, person)

app.controller 'NotesController', ['$scope', 'dataStore', NotesController]
module.exports = NotesController
