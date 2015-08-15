async = require 'async'

class SettingsController

  FIELDS:
    startWorkingTime:
      heading: 'Start Working Time'
      type: 'number'
    endWorkingTime:
      heading: 'End Working Time'
      type: 'number'

  editStore: {}

  constructor: (@$scope, @$http, @dataStore, @dataTransciever, @progress) ->
    @$scope.dataStore = @dataStore
    @$scope.fields = @FIELDS
    @$scope.editStore = @editStore
    @$scope.editPersons = []
    @$scope.up = @_up
    @$scope.down = @_down
    @$scope.remove = @_remove
    @$scope.add = @_add
    @$scope.submit = @_submit
    @$scope.submit2 = @_onSubmit
    @$scope.$watchCollection 'dataStore.settings.persons', @_onWatchPersons
    for key, field of @FIELDS
      @$scope.$watch "dataStore.settings.#{key}", @_onWatchSetting(key)

  _up: (index) =>
    if index is 0 then return
    @$scope.editPersons.splice index - 1, 2, @$scope.editPersons[index], @$scope.editPersons[index - 1]

  _down: (index) =>
    if index >= @$scope.editPersons.length - 1 then return
    @$scope.editPersons.splice index, 2, @$scope.editPersons[index + 1], @$scope.editPersons[index]

  _remove: (index) =>
    @$scope.editPersons.splice index, 1

  _add: =>
    @$scope.editPersons.push {name: "Person #{@$scope.editPersons.length + 1}"}

  _submit: =>
    @progress.open()
    @progress.set 'Saving persons data...', 0
    @$http.put '/settings/save', {key: 'persons', value: @$scope.editPersons}
    .success (data) =>
      return
    .error (data) =>
      return
    .finally =>
      @progress.close()
      @dataTransciever.reParse()

  _onWatchPersons: =>
    if @dataStore.settings?.persons
      @$scope.editPersons = @dataStore.settings.persons

  _onWatchSetting: (key) =>
    return =>
      @editStore[key] = @dataStore.settings?[key]

  _onSubmit: =>
    @progress.open()
    count = 0
    async.forEachOfSeries @FIELDS, (field, key, callback) =>
      if @editStore[key] is @dataStore.settings[key]
        return callback()
      @progress.set "Saving #{key}...", count++ / Object.keys(@FIELDS).count * 100
      @$http.put '/settings/save', {key: key, value: @editStore[key]}
      .success => callback()
      .error => callback "Error saving #{key}"
    , (err) =>
      if err then alert err
      @progress.close()
      @dataTransciever.reParse =>
        @dataTransciever.reload()


app.controller 'SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]
module.exports = SettingsController
