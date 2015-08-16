async = require 'async'

class SettingsController

  FIELDS:
    persons:
      reParse: true
      reload: true
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
    @$scope.up = @_up
    @$scope.down = @_down
    @$scope.remove = @_remove
    @$scope.add = @_add
    @$scope.submit = @_onSubmit
    @$scope.$watchCollection 'dataStore.settings.persons', @_onWatchPersons
    for key, field of @FIELDS
      @$scope.$watch "dataStore.settings.#{key}", @_onWatchSetting(key)

  _up: (index) =>
    if index is 0 then return
    @$scope.editStore.persons.splice index - 1, 2, @$scope.editStore.persons[index], @$scope.editStore.persons[index - 1]

  _down: (index) =>
    if index >= @$scope.editStore.persons.length - 1 then return
    @$scope.editStore.persons.splice index, 2, @$scope.editStore.persons[index + 1], @$scope.editStore.persons[index]

  _remove: (index) =>
    @$scope.editStore.persons.splice index, 1

  _add: =>
    @$scope.editStore.persons.push {name: "Person #{@$scope.editStore.persons.length + 1}"}

  _onWatchPersons: =>
    if @dataStore.settings?.persons
      @$scope.editStore.persons = @dataStore.settings.persons

  _onWatchSetting: (key) =>
    return =>
      @editStore[key] = angular.copy(@dataStore.settings?[key])

  _onSubmit: =>
    @progress.open()
    count = 0
    reParse = false
    reload = false
    async.forEachOfSeries @FIELDS, (field, key, callback) =>
      if JSON.stringify(@editStore[key]) is JSON.stringify(@dataStore.settings[key])
        return callback()
      console.log key
      if field.reParse then reParse = true
      if field.reload then reload = true
      @progress.set "Saving #{key}...", count++ / Object.keys(@FIELDS).count * 100
      @$http.put '/settings/save', {key: key, value: @editStore[key]}
      .success =>
        @dataStore.settings[key] = @editStore[key]
        callback()
      .error => callback "Error saving #{key}"
    , (err) =>
      if err then alert err
      @progress.close()
      async.waterfall [
        (callback) =>
          if reParse
            console.log 'reParse'
            @dataTransciever.reParse callback
          else
            callback()
        (callback) =>
          if reload
            console.log 'reload'
            @dataTransciever.reload callback
          else
            callback()
      ]



app.controller 'SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]
module.exports = SettingsController
