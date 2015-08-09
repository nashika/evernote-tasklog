class TimelineController

  constructor: (@$scope, @$filter) ->
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    container = document.getElementById('timeline')
    options =
      margin: {item: 5}
      height: window.innerHeight - 80
      orientation: {axis: 'both', item: 'top'}
      start: moment().startOf('day')
      end: moment().endOf('day')
      hiddenDates: [
        {start: moment().subtract(1, 'days').startOf('day').hour(20), end: moment().startOf('day').hour(8), repeat: 'daily'}
      ]
      order: (a, b) -> a.start - b.start

    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)
    @$scope.$watchCollection 'persons', @_onWatchPersons
    @$scope.$watchCollection 'notes', @_onWatchNotes
    @$scope.$watchCollection 'timeLogs', @_onWatchNotes
    @$scope.$watchCollection 'profitLogs', @_onWatchProfitLogs
    @$scope.$on 'resize::resize', @_onResize

  _onWatchPersons: =>
    @$scope.timelineGroups.clear()
    for key, person of @$scope.persons
      @$scope.timelineGroups.add
        id: key
        content: person
    @$scope.timelineGroups.add
      id: 'updated'
      content: 'Update'

  _onWatchNotes: =>
    @$scope.timelineItems.clear()
    for noteGuid, note of @$scope.notes
      @$scope.timelineItems.add
        id: note.guid
        group: 'updated'
        content: "<a href=\"evernote:///view/#{@$scope.user.id}/#{@$scope.user.shardId}/#{note.guid}/#{note.guid}/\" title=\"#{note.title}\">#{@$filter('abbreviate')(note.title, 40)}</a>"
        start: new Date(note.updated)
        type: 'point'
    for noteGuid, noteTimeLog of @$scope.timeLogs
      for timeLogs_id, timeLog of noteTimeLog
        @$scope.timelineItems.add
          id: timeLog._id
          group: timeLog.person
          content: "<a href=\"evernote:///view/#{@$scope.user.id}/#{@$scope.user.shardId}/#{timeLog.noteGuid}/#{timeLog.noteGuid}/\" title=\"#{@$scope.notes[timeLog.noteGuid].title} #{timeLog.comment}\">#{@$filter('abbreviate')(@$scope.notes[timeLog.noteGuid].title, 20)} #{@$filter('abbreviate')(timeLog.comment, 20)}</a>"
          start: moment(timeLog.date)
          end: if timeLog.spentTime then moment(timeLog.date).add(timeLog.spentTime, 'minutes') else null
          type: if timeLog.spentTime then 'range' else 'point'

  _onWatchProfitLogs: =>

  _onResize: (event) =>
    @$scope.timeline.setOptions
      height: window.innerHeight - 90


app.controller 'TimelineController', ['$scope', '$filter', TimelineController]
module.exports = TimelineController
