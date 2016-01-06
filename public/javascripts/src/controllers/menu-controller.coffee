class MenuController

  lastQueryStr: null

  constructor: (@$scope, @$http, @dataStore, @dataTransciever, @noteQuery, @timeLogQuery) ->
    @$scope.dataStore = @dataStore
    @$scope.dataTransciever = @dataTransciever
    @$scope.noteQuery = @noteQuery
    @$scope.timeLogQuery = @timeLogQuery
    @$scope.$watchGroup ['noteQuery.updated', 'noteQuery.notebooks', 'noteQuery.stacks', 'noteQuery.worked'], @_onWatchNoteQuery
    @$scope.$watchGroup ['timeLogQuery.worked'], @_onWatchTimeLogQuery

  _onWatchNoteQuery: =>
    query = @noteQuery.query()
    queryStr = JSON.stringify(query)
    if @lastQueryStr is queryStr then return
    @lastQueryStr = queryStr
    @$http.get '/notes/count', {params: {query: query}}
    .success (data) =>
      @noteQuery.count = data
    .error =>
      @noteQuery.count = null

  _onWatchTimeLogQuery: =>
    query = @timeLogQuery.query()
    queryStr = JSON.stringify(query)
    if @lastQueryStr is queryStr then return
    @lastQueryStr = queryStr
    @$http.get '/time-logs/count', {params: {query: query}}
    .success (data) =>
      @timeLogQuery.count = data
    .error =>
      @timeLogQuery.count = null

app.controller 'MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'noteQuery', 'timeLogQuery', MenuController]
module.exports = MenuController
