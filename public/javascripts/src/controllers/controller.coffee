async = require 'async'

class Controller

  constructor: (@$scope, @$rootScope, @$http, @viewUtil) ->
    @$rootScope.persons = {}
    @$rootScope.notes = {}
    @$rootScope.timeLogs = {}
    @$scope.reload = @reload
    @reload =>

  reload: (callback) =>
    if not callback then callback = =>
    async.series [
      # sync
      (callback) =>
        @$http.get '/sync'
        .success => callback()
        .error (data) => callback(data)
      # get persons
      (callback) =>
        @$http.get '/persons'
        .success (data) =>
          @$rootScope.persons = {}
          for person in data
            @$rootScope.persons[person] = person
          callback()
        .error (data) => callback(data)
      # get notes
      (callback) =>
        @$http.get '/notes', {params: {query: {}, content: true}}
        .success (data) =>
          @$rootScope.notes = {}
          for note in data
            @$rootScope.notes[note.guid] = note
          callback()
        .error (data) => callback(data)
      (callback) =>
        @$http
          method : 'GET'
          url : '/time-logs'
        .success (data) =>
          @$rootScope.timeLogs = {}
          for timeLog in data
            @$rootScope.timeLogs[timeLog.noteGuid] ?= {}
            @$rootScope.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
          callback()
        .error (data) => callback(data)
    ], (err) =>
      if err then return throw new Error(err)
      callback(err)

app.controller 'Controller', ['$scope', '$rootScope', '$http', 'viewUtil', Controller]
module.exports = Controller
