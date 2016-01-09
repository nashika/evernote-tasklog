async = require 'async'

class TimelineController

  constructor: (@$scope, @$filter, @$http, @dataStore, @dataTransciever) ->
    @$scope.dataStore = @dataStore
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    @$scope.start = moment().startOf('day')
    @$scope.end = moment().endOf('day')
    @dataTransciever.reload {start: @$scope.start, end: @$scope.end}, =>
      container = document.getElementById('timeline')
      # set working time
      if @dataStore.settings?.startWorkingTime and @dataStore.settings?.endWorkingTime
        hiddenDates = [{
          start: moment().subtract(1, 'days').startOf('day').hour(@dataStore.settings.endWorkingTime)
          end: moment().startOf('day').hour(@dataStore.settings.startWorkingTime)
          repeat: 'daily'
        }]
      else
        hiddenDates = {}
      # generate timeline object
      @$scope.timeline = new vis.Timeline container, @$scope.timelineItems, @$scope.timelineGroups,
        margin: {item: 5}
        height: window.innerHeight - 80
        orientation: {axis: 'both', item: 'top'}
        start: @$scope.start
        end: @$scope.end
        order: (a, b) -> a.start - b.start
        hiddenDates: hiddenDates
      # set person data
      if not @dataStore.settings?.persons then return
      for person, index in @dataStore.settings.persons
        @$scope.timelineGroups.add
          id: person.name
          content: person.name
      @$scope.timelineGroups.add
        id: 'updated'
        content: 'Update'
      # add events
      @$scope.timeline.on 'rangechanged', @_onRangeChanged
      @$scope.$on 'resize::resize', @_onResize
      @$scope.$on 'event::reload', @_onReload
      # reload
      @_onReloadEnd()

  _onRangeChanged: (properties) =>
    currentStart = moment(properties.start).startOf('day')
    currentEnd = moment(properties.end).endOf('day')
    if currentStart.isSameOrAfter(@$scope.start) and currentEnd.isSameOrBefore(@$scope.end)
      return
    @$scope.start = currentStart if not @$scope.start or currentStart.isBefore(@$scope.start)
    @$scope.end = currentEnd if not @$scope.end or currentEnd.isAfter(@$scope.end)
    @_onReload()

  _onReload: =>
    @dataTransciever.reload {start: @$scope.start, end: @$scope.end}, @_onReloadEnd

  _onReloadEnd: =>
    @$scope.timelineItems.clear()
    for noteGuid, note of @dataStore.notes
      notes[note.guid] = note
      @$scope.timelineItems.add
        id: note.guid
        group: 'updated'
        content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{note.guid}/#{note.guid}/\" title=\"#{note.title}\">#{@$filter('abbreviate')(note.title, 40)}</a>"
        start: new Date(note.updated)
        type: 'point'
    for noteGuid, noteTimeLogs of @dataStore.timeLogs
      for timeLogId, timeLog of noteTimeLogs
        noteTitle = notes[timeLog.noteGuid].title
        @$scope.timelineItems.add
          id: timeLog._id
          group: timeLog.person
          content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{timeLog.noteGuid}/#{timeLog.noteGuid}/\" title=\"#{noteTitle} #{timeLog.comment}\">#{@$filter('abbreviate')(noteTitle, 20)} #{@$filter('abbreviate')(timeLog.comment, 20)}</a>"
          start: moment(timeLog.date)
          end: if timeLog.spentTime then moment(timeLog.date).add(timeLog.spentTime, 'minutes') else null
          type: if timeLog.spentTime then 'range' else 'point'

  _onResize: (event) =>
    @$scope.timeline.setOptions
      height: window.innerHeight - 90


app.controller 'TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]
module.exports = TimelineController
