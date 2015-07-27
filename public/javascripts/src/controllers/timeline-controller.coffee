async = require 'async'

class TimelineController

  constructor: (@$scope) ->
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    container = document.getElementById('timeline')
    options =
      margin: {item: 2}
    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)
    @$scope.$watchCollection 'persons', @_onWatchPersons
    @$scope.$watchCollection 'notes', @_onWatchNotes
    @$scope.$watchCollection 'timeLogs', @_onWatchTimeLogs
    @$scope.$watchCollection 'profitLogs', @_onWatchProfitLogs

  _onWatchPersons: (newPersons, oldPersons) =>
    @$scope.timelineGroups.clear()
    @$scope.timelineGroups.add
      id: 'updated'
      content: 'Note Updated'
    for key, person of newPersons
      @$scope.timelineGroups.add
        id: key
        content: person

  _onWatchNotes: (newNotes, oldNotes) =>
    for guid, note of oldNotes
      @$scope.timelineItems.remove guid
    for guid, note of newNotes
      @$scope.timelineItems.add
        id: guid
        group: 'updated'
        content: note.title
        start: new Date(note.updated)
        type: 'point'

  _onWatchTimeLogs: (newTimeLogs, oldTimeLogs) =>
    for noteGuid, noteTimeLogs of oldTimeLogs
      for _id, timeLog of noteTimeLogs
        @$scope.timelineItems.remove _id
    for noteGuid, noteTimeLogs of newTimeLogs
      for _id, timeLog of noteTimeLogs
        start = new Date(timeLog.date)
        if timeLog.spentTime
          end = new Date(start)
          end.setMinutes start.getMinutes() + timeLog.spentTime
        else
          end = null
        @$scope.timelineItems.add
          id: _id
          group: timeLog.person
          content: @$scope.notes[timeLog.noteGuid].title + '<br>' + timeLog.comment
          start: start
          end: end

  _onWatchProfitLogs: (newProfitLogs, oldProfitLogs) =>

app.controller 'TimelineController', ['$scope', TimelineController]
module.exports = TimelineController
