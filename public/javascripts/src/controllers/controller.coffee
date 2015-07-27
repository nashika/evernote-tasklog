async = require 'async'

class Controller

  constructor: (@$scope, @$rootScope, @$http, @viewUtil) ->
    @$rootScope.persons = {}
    @$rootScope.notes = {}
    @$rootScope.timeLogs = {}
    @reload (err) =>
      if err then return throw new Error(err)

  reload: (callback) =>
    async.series [
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
        @$http.get '/notes', {params: {query: {}}}
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
    ], callback

app.controller 'Controller', ['$scope', '$rootScope', '$http', 'viewUtil', Controller]
module.exports = Controller
