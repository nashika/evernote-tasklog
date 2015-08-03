async = require 'async'

class Controller

  constructor: (@$scope, @$rootScope, @$http, @progress, @noteFilter) ->
    @$rootScope.user = null
    @$rootScope.persons = {}
    @$rootScope.notebooks = {}
    @$rootScope.stacks = []
    @$rootScope.notes = {}
    @$rootScope.timeLogs = {}
    @$scope.reload = @reload
    @reload =>

  reload: (callback) =>
    if not callback then callback = =>
    query = @noteFilter.query()
    noteCount = 0
    @progress.open()
    async.series [
      # get user
      (callback) =>
        if @$rootScope.user then return callback()
        @progress.set 'Getting user data.', 0
        @$http.get '/user'
        .success (data) =>
          @$rootScope.user = data
          callback()
        .error => callback('Error $http request')
      # sync
      (callback) =>
        @progress.set 'Syncing remote server.', 0
        @$http.get '/sync'
        .success => callback()
        .error => callback('Error $http request')
      # get persons
      (callback) =>
        @progress.set 'Getting persons data.', 10
        @$http.get '/persons'
        .success (data) =>
          @$rootScope.persons = {}
          for person in data
            @$rootScope.persons[person] = person
          callback()
        .error => callback('Error $http request')
      # get notebooks
      (callback) =>
        @progress.set 'Getting notebooks data.', 20
        @$http.get '/notebooks'
        .success (data) =>
          @$rootScope.notebooks = {}
          stackHash = {}
          for notebook in data
            @$rootScope.notebooks[notebook.guid] = notebook
            stackHash[notebook.stack] = true if notebook.stack
          @$rootScope.stacks = Object.keys(stackHash)
          callback()
        .error => callback('Error $http request')
      (callback) =>
        @progress.set 'Getting notes count.', 30
        @$http.get '/notes/count', {params: {query: query}}
        .success (data) =>
          noteCount = data
          if noteCount > 100
            if window.confirm "Current query find #{noteCount} notes. It is too many. Continue anyway?"
              callback()
            else
              callback 'User Canceled'
          else
            callback()
        .error => callback('Error $http request')
      # get content from remote
      (callback) =>
        @progress.set 'Request remote contents.', 40
        @$http.get '/notes/get-content', {params: {query: query}}
        .success => callback()
        .error => callback('Error $http request')
      # get notes
      (callback) =>
        @progress.set 'Getting notes.', 60
        @$http.get '/notes', {params: {query: query, content: false}}
        .success (data) =>
          @$rootScope.notes = {}
          for note in data
            @$rootScope.notes[note.guid] = note
          callback()
        .error => callback('Error $http request')
      (callback) =>
        @progress.set 'Getting time logs.', 80
        guids = for noteGuid, note of @$rootScope.notes then note.guid
        @$http.post '/time-logs', {query: {noteGuid: {$in: guids}}, limit: 300}
        .success (data) =>
          @$rootScope.timeLogs = {}
          for timeLog in data
            @$rootScope.timeLogs[timeLog.noteGuid] ?= {}
            @$rootScope.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog
          callback()
        .error => callback('Error $http request')
    ], (err) =>
      @progress.set 'Done.', 100
      @progress.close()
      if err then return throw new Error(err)
      callback(err)

app.controller 'Controller', ['$scope', '$rootScope', '$http', 'progress', 'noteFilter', Controller]
module.exports = Controller
