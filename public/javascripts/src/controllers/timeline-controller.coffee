async = require 'async'

class TimelineController

  constructor: (@$scope, @$filter, @$http, @dataStore) ->
    @$scope.dataStore = @dataStore
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    @$scope.start = null
    @$scope.end = null
    start = moment().startOf('day')
    end = moment().endOf('day')
    container = document.getElementById('timeline')
    options =
      margin: {item: 5}
      height: window.innerHeight - 80
      orientation: {axis: 'both', item: 'top'}
      start: start
      end: end
      order: (a, b) -> a.start - b.start

    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)
    @$scope.timeline.on 'rangechanged', @_onRangeChanged
    @$scope.$watchCollection 'dataStore.settings.persons', @_onWatchPersons
    @$scope.$watchGroup ['dataStore.settings.startWorkingTime', 'dataStore.settings.endWorkingTime'], @_onWatchWorkingTime
    @$scope.$on 'resize::resize', @_onResize
    @_onRangeChanged {start: start, end: end}

  _onRangeChanged: (properties) =>
    start = moment(properties.start).startOf('day')
    end = moment(properties.end).endOf('day')
    if start.isSameOrAfter(@$scope.start) and end.isSameOrBefore(@$scope.end)
      return
    @$scope.start = start if not @$scope.start or start.isBefore(@$scope.start)
    @$scope.end = end if not @$scope.end or end.isAfter(@$scope.end)
    @$scope.timelineItems.clear()
    notes = {}
    # get time logs
    async.series [
      (callback) =>
        @$http.get '/notes',
          params:
            query:
              updated:
                $gte: @$scope.start.valueOf()
        .success (data) =>
          for note in data
            notes[note.guid] = note
            @$scope.timelineItems.add
              id: note.guid
              group: 'updated'
              content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{note.guid}/#{note.guid}/\" title=\"#{note.title}\">#{@$filter('abbreviate')(note.title, 40)}</a>"
              start: new Date(note.updated)
              type: 'point'
          callback()
        .error => callback('Error $http request')
      (callback) =>
        @$http.get '/time-logs',
          params:
            query:
              date:
                $gte: @$scope.start.valueOf()
                $lte: @$scope.end.valueOf()
        .success (data) =>
          for timeLog in data
            noteTitle = notes[timeLog.noteGuid].title
            @$scope.timelineItems.add
              id: timeLog._id
              group: timeLog.person
              content: "<a href=\"evernote:///view/#{@dataStore.user.id}/#{@dataStore.user.shardId}/#{timeLog.noteGuid}/#{timeLog.noteGuid}/\" title=\"#{noteTitle} #{timeLog.comment}\">#{@$filter('abbreviate')(noteTitle, 20)} #{@$filter('abbreviate')(timeLog.comment, 20)}</a>"
              start: moment(timeLog.date)
              end: if timeLog.spentTime then moment(timeLog.date).add(timeLog.spentTime, 'minutes') else null
              type: if timeLog.spentTime then 'range' else 'point'
          callback()
        .error => callback('Error $http request')
    ]

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

  _onResize: (event) =>
    @$scope.timeline.setOptions
      height: window.innerHeight - 90


app.controller 'TimelineController', ['$scope', '$filter', '$http', 'dataStore', TimelineController]
module.exports = TimelineController
