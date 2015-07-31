async = require 'async'

class Controller

  constructor: (@$scope, @$rootScope, @$http, @$modal, @viewUtil) ->
    @$rootScope.persons = {}
    @$rootScope.notes = {}
    @$rootScope.timeLogs = {}
    @$scope.reload = @reload
    @reload =>

  reload: (callback) =>
    if not callback then callback = =>
    modalInstance = @$modal.open
      templateUrl: 'progress'
      backdrop: 'static'
      keyboard: false
      size: 'sm'
      animation: false
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
      # get notebooks
      (callback) =>
        @$http.get '/notebooks'
        .success (data) =>
          @$rootScope.notebooks = data
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
      modalInstance.close()
      if err then return throw new Error(err)
      callback(err)

app.controller 'Controller', ['$scope', '$rootScope', '$http', '$modal', 'viewUtil', Controller]
module.exports = Controller
