async = require 'async'

class Controller

  constructor: (@$scope, @$rootScope, @$http, @progress) ->
    @$rootScope.persons = {}
    @$rootScope.notes = {}
    @$rootScope.timeLogs = {}
    @$scope.reload = @reload
    @reload =>

  reload: (callback) =>
    if not callback then callback = =>
    query = {}
    noteCount = 0
    @progress.open()
    async.series [
      # sync
      (callback) =>
        @progress.set 'Syncing remote server.', 0
        @$http.get '/sync'
        .success => callback()
        .error (data) => callback(data)
      # get persons
      (callback) =>
        @progress.set 'Getting persons data.', 10
        @$http.get '/persons'
        .success (data) =>
          @$rootScope.persons = {}
          for person in data
            @$rootScope.persons[person] = person
          callback()
        .error (data) => callback(data)
      # get notebooks
      (callback) =>
        @progress.set 'Getting notebooks data.', 20
        @$http.get '/notebooks'
        .success (data) =>
          @$rootScope.notebooks = data
          callback()
        .error (data) => callback(data)
      # get note count
      (callback) =>
        @progress.set 'Getting note count.', 30
        @$http.get '/notes/count', {params: {query: query}}
        .success (data) =>
          noteCount = data
          callback()
        .error (data) => callback(data)
      # get content from remote
      (callback) =>
        @progress.set 'Request remote contents.', 40
        @$http.get '/notes/get-content', {params: {query: query}}
        .success (data) => callback()
        .error (data) => callback(data)
      # get notes
      (callback) =>
        @progress.set 'Getting notes.', 60
        @$http.get '/notes', {params: {query: query, content: false}}
        .success (data) =>
          @$rootScope.notes = data
          callback()
        .error (data) => callback(data)
      (callback) =>
        @progress.set 'Getting time logs.', 80
        @$http
          method : 'GET'
          url : '/time-logs'
        .success (data) =>
          @$rootScope.timeLogs = data
          callback()
        .error (data) => callback(data)
    ], (err) =>
      @progress.set 'Done.', 100
      @progress.close()
      if err then return throw new Error(err)
      callback(err)

app.controller 'Controller', ['$scope', '$rootScope', '$http', 'progress', Controller]
module.exports = Controller
