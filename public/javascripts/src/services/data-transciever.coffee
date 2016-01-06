async = require 'async'
merge = require 'merge'

class DataTranscieverService

  ###*
  # @constructor
  # @param {$HttpProvider} $http
  # @param {DataStoreService} dataStore
  # @param {NoteQueryService} noteQuery
  # @param {TimeLogQueryService} timeLogQuery
  # @param {ProgressService} progress
  ###
  constructor: (@$http, @dataStore, @noteQuery, @timeLogQuery, @progress) ->

  ###*
  # @public
  # @param {function} callback
  ###
  reload: (callback) =>
    if not callback then callback = =>
    query = @noteQuery.query()
    noteCount = 0
    @progress.open()
    async.series [
      # get user
      (callback) =>
        if @dataStore.user then return callback()
        @progress.set 'Getting user data.', 0
        @$http.get '/user'
        .success (data) =>
          @dataStore.user = data
          callback()
        .error => callback('Error $http request')
      # get settings
      (callback) =>
        @progress.set 'Getting settings data.', 10
        @$http.get '/settings'
        .success (data) =>
          @dataStore.settings = data
          callback()
        .error => callback('Error $http request')
      # check settings
      (callback) =>
        if not @dataStore.settings.persons or @dataStore.settings.persons.length is 0
          return callback 'This app need persons setting. Please switch "Settings Page" and set your persons data.'
        callback()
      # sync
      (callback) =>
        @progress.set 'Syncing remote server.', 20
        @$http.get '/sync'
        .success => callback()
        .error => callback('Error $http request')
      # get notebooks
      (callback) =>
        @progress.set 'Getting notebooks data.', 30
        @$http.get '/notebooks'
        .success (data) =>
          @dataStore.notebooks = {}
          stackHash = {}
          for notebook in data
            @dataStore.notebooks[notebook.guid] = notebook
            stackHash[notebook.stack] = true if notebook.stack
          @dataStore.stacks = Object.keys(stackHash)
          callback()
        .error => callback('Error $http request')
      (callback) =>
        @progress.set 'Getting notes count.', 40
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
        @progress.set 'Request remote contents.', 50
        @$http.get '/notes/get-content', {params: {query: query}}
        .success => callback()
        .error => callback('Error $http request')
      # get notes
      (callback) =>
        @progress.set 'Getting notes.', 70
        @$http.get '/notes', {params: {query: query, content: false}}
        .success (data) =>
          @dataStore.notes = {}
          for note in data
            @dataStore.notes[note.guid] = note
          callback()
        .error => callback('Error $http request')
      # get time logs
      (callback) =>
        @progress.set 'Getting time logs.', 80
        guids = for noteGuid, note of @dataStore.notes then note.guid
        @$http.post '/time-logs', {query: merge(true, @timeLogQuery.query(), {noteGuid: {$in: guids}})}
        .success (data) =>
          @dataStore.timeLogs = {}
          for timeLog in data
            @dataStore.timeLogs[timeLog.noteGuid] ?= {}
            @dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog
          callback()
        .error => callback('Error $http request')
      # get profit logs
      (callback) =>
        @progress.set 'Getting profit logs.', 90
        guids = for noteGuid, note of @dataStore.notes then note.guid
        @$http.post '/profit-logs', {query: {noteGuid: {$in: guids}}}
        .success (data) =>
          @dataStore.profitLogs = {}
          for profitLog in data
            @dataStore.profitLogs[profitLog.noteGuid] ?= {}
            @dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog
          callback()
        .error => callback('Error $http request')
    ], (err) =>
      if err
        alert err
      else
        @progress.set 'Done.', 100
      @progress.close()
      callback(err)

  reParse: (callback) ->
    if not callback then callback = =>
    @progress.open()
    @progress.set 'Re Parse notes...', 50
    async.waterfall [
      (callback) =>
        @$http.get '/notes/re-parse'
        .success (data) => callback()
        .error (data) => callback('Error $http request')
    ], (err) =>
      @progress.set 'Done.', 100
      @progress.close()
      callback(err)

app.service 'dataTransciever', ['$http', 'dataStore', 'noteQuery', 'timeLogQuery', 'progress', DataTranscieverService]
module.exports = DataTranscieverService
