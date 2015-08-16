class TimelineController

  constructor: (@$scope, @$filter, @dataStore) ->
    @$scope.dataStore = @dataStore
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    container = document.getElementById('timeline')
    options =
      margin: {item: 5}
      height: window.innerHeight - 80
      orientation: {axis: 'both', item: 'top'}
      start: moment().startOf('day')
      end: moment().endOf('day')
      order: (a, b) -> a.start - b.start

    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)
    @$scope.$watchCollection 'dataStore.settings.persons', @_onWatchPersons
    @$scope.$watchGroup ['dataStore.settings.startWorkingTime', 'dataStore.settings.endWorkingTime'], @_onWatchWorkingTime
    @$scope.$watchCollection 'dataStore.notes', @_onWatchNotes
    @$scope.$watchCollection 'dataStore.timeLogs', @_onWatchNotes
    @$scope.$watchCollection 'dataStore.profitLogs', @_onWatchProfitLogs
    @$scope.$on 'resize::resize', @_onResize

  _onWatchPersons: =>
    if not @dataStore.settings?.persons then return
    @$scope.timelineGroups.clear()
    for person, index in @dataStore.settings.persons
      @$scope.timelineGroups.add
        id: person.name
        content: person.name
    @$scope.timelineGroups.add
      id: 'updated'
      content: 'Update'

  _onWatchWorkingTime: =>
    if @dataStore.settings?.startWorkingTime and @dataStore.settings?.endWorkingTime
      @$scope.timeline.setOptions
        hiddenDates: [{
          start: moment().subtract(1, 'days').startOf('day').hour(@dataStore.settings.endWorkingTime)
          end: moment().startOf('day').hour(@dataStore.settings.startWorkingTime)
          repeat: 'daily'
        }]
    else
      @$scope.timeline.setOptions {hiddenDates: {}}

  _onWatchNotes: =>
    @$scope.timelineItems.clear()
    for noteGuid, note of @dataStore.notes
      @$scope.timelineItems.add
        id: note.guid
        group: 'updated'
        content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{note.guid}/#{note.guid}/\" title=\"#{note.title}\">#{@$filter('abbreviate')(note.title, 40)}</a>"
        start: new Date(note.updated)
        type: 'point'
    for noteGuid, noteTimeLog of @dataStore.timeLogs
      for timeLogs_id, timeLog of noteTimeLog
        @$scope.timelineItems.add
          id: timeLog._id
          group: timeLog.person
          content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{timeLog.noteGuid}/#{timeLog.noteGuid}/\" title=\"#{@dataStore.notes[timeLog.noteGuid].title} #{timeLog.comment}\">#{@$filter('abbreviate')(@dataStore.notes[timeLog.noteGuid].title, 20)} #{@$filter('abbreviate')(timeLog.comment, 20)}</a>"
          start: moment(timeLog.date)
          end: if timeLog.spentTime then moment(timeLog.date).add(timeLog.spentTime, 'minutes') else null
          type: if timeLog.spentTime then 'range' else 'point'

  _onWatchProfitLogs: =>

  _onResize: (event) =>
    @$scope.timeline.setOptions
      height: window.innerHeight - 90


app.controller 'TimelineController', ['$scope', '$filter', 'dataStore', TimelineController]
module.exports = TimelineController
