class SettingsController

  lastQueryStr: null

  constructor: (@$scope) ->
    @$scope.up = @_up
    @$scope.down = @_down
    @$scope.remove = @_remove
    @$scope.add = @_add
    @$scope.submit = @_submit
    @$scope.$watchCollection 'persons', @_onWatchPersons

  _up: (index) =>
    if index is 0 then return
    @$scope.editPersons.splice index - 1, 2, @$scope.editPersons[index], @$scope.editPersons[index - 1]

  _down: (index) =>
    if index >= @$scope.editPersons.length - 1 then return
    @$scope.editPersons.splice index, 2, @$scope.editPersons[index + 1], @$scope.editPersons[index]

  _remove: (index) =>
    @$scope.editPersons.splice index, 1

  _add: () =>
    @$scope.editPersons.push "Person #{@$scope.editPersons.length + 1}"

  _onWatchPersons: =>
    @$scope.editPersons = Object.keys(@$scope.persons)

app.controller 'SettingsController', ['$scope', SettingsController]
module.exports = SettingsController
