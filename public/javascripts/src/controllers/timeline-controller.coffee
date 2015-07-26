async = require 'async'

class TimelineController

  constructor: (@$scope, @$http) ->
    @$scope.persons = {}
    @$scope.notes = {}
    @$scope.timeLogs = {}
    @$scope.timelineItems = new vis.DataSet()
    @$scope.timelineGroups = new vis.DataSet()
    container = document.getElementById('timeline')
    options =
      margin: {item: 2}
    @$scope.timeline = new vis.Timeline(container, @$scope.timelineItems, @$scope.timelineGroups, options)

    async.series [
      # get persons
      (callback) =>
        @$scope.timelineGroups.add
          id: 'updated'
          content: 'Note Updated'
        @$http.get '/persons'
        .success (data) =>
          for person in data
            @$scope.persons[person] = person
            @$scope.timelineGroups.add
              id: person
              content: person
          callback()
        .error (data) => callback(data)
      # get notes
      (callback) =>
        @$http.get '/notes'
        .success (data) =>
          for note in data
            @$scope.notes[note.guid] = note
            @$scope.timelineItems.add
              id: note.guid
              group: 'updated'
              content: note.title
              start: new Date(note.updated)
              type: 'point'
          callback()
        .error (data) => callback(data)
      (callback) =>
        @$http
          method : 'GET'
          url : '/time-logs'
        .success (data) =>
          for timeLog in data
            @$scope.timeLogs[timeLog.noteGuid] ?= {}
            @$scope.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
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
                content: @$scope.notes[timeLog.noteGuid].title + '<br>' + timeLog.comment
                start: start
                end: end
          callback()
        .error (data) => callback(data)
    ], (err) =>
      if err then return throw new Error(err)
      @$scope.timeline.fit()

app.controller 'TimelineController', ['$scope', '$http', TimelineController]
module.exports = TimelineController
