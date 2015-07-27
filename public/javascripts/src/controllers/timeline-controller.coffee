async = require 'async'

class TimelineController

  constructor: (@$scope) ->
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    container = document.getElementById('timeline')
    options =
      margin: {item: 5}
      height: '1000px'
      orientation: {axis: 'both', item: 'top'}
    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)
    @$scope.$watchCollection 'persons', @_onWatchPersons
    @$scope.$watchCollection 'notes', @_onWatchNotes
    @$scope.$watchCollection 'timeLogs', @_onWatchNotes
    @$scope.$watchCollection 'profitLogs', @_onWatchProfitLogs

  _onWatchPersons: (newPersons, oldPersons) =>
    @$scope.timelineGroups.clear()
    for key, person of newPersons
      @$scope.timelineGroups.add
        id: key
        content: person
    @$scope.timelineGroups.add
      id: 'updated'
      content: 'Note Updated'

  _onWatchNotes: () =>
    @$scope.timelineItems.clear()
    for guid, note of @$scope.notes
      @$scope.timelineItems.add
        id: guid
        group: 'updated'
        content: note.title
        start: new Date(note.updated)
        type: 'point'
    for noteGuid, noteTimeLogs of @$scope.timeLogs
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
          content: @$scope.notes[timeLog.noteGuid].title + ' ' + timeLog.comment
          start: start
          end: end
          type: if end then 'range' else 'point'

  _onWatchProfitLogs: (newProfitLogs, oldProfitLogs) =>

app.controller 'TimelineController', ['$scope', TimelineController]
module.exports = TimelineController
