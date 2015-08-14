class SettingsController

  lastQueryStr: null

  constructor: (@$scope, @$http, @dataStore, @dataTransciever, @progress) ->
    @$scope.dataStore = @dataStore
    @$scope.editPersons = []
    @$scope.up = @_up
    @$scope.down = @_down
    @$scope.remove = @_remove
    @$scope.add = @_add
    @$scope.submit = @_submit
    @$scope.$watchCollection 'dataStore.settings.persons', @_onWatchPersons

  _up: (index) =>
    if index is 0 then return
    @$scope.editPersons.splice index - 1, 2, @$scope.editPersons[index], @$scope.editPersons[index - 1]

  _down: (index) =>
    if index >= @$scope.editPersons.length - 1 then return
    @$scope.editPersons.splice index, 2, @$scope.editPersons[index + 1], @$scope.editPersons[index]

  _remove: (index) =>
    @$scope.editPersons.splice index, 1

  _add: =>
    @$scope.editPersons.push "Person #{@$scope.editPersons.length + 1}"

  _submit: =>
    @progress.open()
    @progress.set 'Saving persons data...', 0
    persons = {}
    for editPerson in @$scope.editPersons
      persons[editPerson] = editPerson
    @$http.put '/settings/save', {key: 'persons', value: persons}
    .success (data) =>
      return
    .error (data) =>
      return
    .finally =>
      @progress.close()
      @dataTransciever.reParse()

  _onWatchPersons: =>
    if @dataStore.settings?.persons
      @$scope.editPersons = Object.keys(@dataStore.settings.persons)

app.controller 'SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]
module.exports = SettingsController
