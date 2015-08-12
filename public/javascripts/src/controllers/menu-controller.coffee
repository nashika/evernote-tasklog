class MenuController

  constructor: (@$scope, @$http, @dataStore, @dataTransciever, @noteQuery) ->
    @$scope.dataStore = @dataStore
    @$scope.dataTransciever = @dataTransciever
    @$scope.noteQuery = @noteQuery
    @$scope.$watchGroup ['noteQuery.updated', 'noteQuery.notebooks', 'noteQuery.stacks'], @_onWatchNoteQuery

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

app.controller 'MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'noteQuery', MenuController]
module.exports = MenuController
