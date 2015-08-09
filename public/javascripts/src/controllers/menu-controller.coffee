class MenuController

  constructor: (@$scope, @$http, @noteFilter) ->
    @$scope.noteFilter = @noteFilter
    @$scope.$watchGroup ['noteFilter.updated', 'noteFilter.notebooks', 'noteFilter.stacks'], @_onWatchNoteFilter

  _onWatchNoteFilter: =>
    query = @noteFilter.query()
    queryStr = JSON.stringify(query)
    if @lastQueryStr is queryStr then return
    @lastQueryStr = queryStr
    @$http.get '/notes/count', {params: {query: query}}
    .success (data) =>
      @noteFilter.count = data
    .error =>
      @noteFilter.count = null

app.controller 'MenuController', ['$scope', '$http', 'noteFilter', MenuController]
module.exports = MenuController
