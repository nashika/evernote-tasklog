class SettingsController

  lastQueryStr: null

  constructor: (@$scope, @$http, @noteFilter) ->
    @$scope.noteFilter = @noteFilter
    @$scope.$watch 'noteFilter', @_onWatchNoteFilter, true

  _onWatchNoteFilter: =>
    query = @noteFilter.query()
    queryStr = JSON.stringify(query)
    if @lastQueryStr is queryStr then return
    @lastQueryStr = queryStr
    console.log {query: query}
    @$http.get '/notes/count', {params: {query: query}}
      .success (data) =>
        @noteFilter.count = data
      .error (data) =>
        @noteFilter.count = null

app.controller 'SettingsController', ['$scope', '$http', 'noteFilter', SettingsController]
module.exports = SettingsController
