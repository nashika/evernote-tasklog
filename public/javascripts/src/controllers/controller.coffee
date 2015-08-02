class Controller

  constructor: (@$scope, @$rootScope, @$http, @progress, @noteFilter) ->
    @$rootScope.persons = {}
    @$rootScope.notebooks = {}
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
            @$rootScope.notebooks = {}
            for notebook in data
              @$rootScope.notebooks[notebook.guid] = notebook
            callback()
          .error (data) => callback(data)
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
            @$rootScope.notes = {}
            for note in data
              @$rootScope.notes[note.guid] = note
            callback()
          .error (data) => callback(data)
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
          .error (data) => callback(data)
    ], (err) =>
      @progress.set 'Done.', 100
      @progress.close()
      if err then return throw new Error(err)
      callback(err)

app.controller 'Controller', ['$scope', '$rootScope', '$http', 'progress', 'noteFilter', Controller]
module.exports = Controller
