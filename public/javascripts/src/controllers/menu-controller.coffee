class MenuController

  constructor: (@$scope, @$http, @dataStore, @dataTransciever) ->
    @$scope.dataStore = @dataStore
    @$scope.dataTransciever = @dataTransciever
    @$scope.noteCount = null
    @$scope.$watchGroup ['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], @_onWatchFilterParams
    @$scope.$on 'event::reload', @_onReload

  _onReload: =>
    @dataTransciever.reload()

  _onWatchFilterParams: =>
    @dataTransciever.countNotes (err, count) =>
      if err
        alert err
        return
      @$scope.noteCount = count

app.controller 'MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]
module.exports = MenuController
