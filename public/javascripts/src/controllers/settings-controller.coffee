async = require 'async'

class SettingsController

  ###*
  # @const
  # @type {Object}
  ###
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

  ###*
  # @protected
  # @type {Object}
  ###
  _editStore: {}

  constructor: (@$scope, @$http, @dataStore, @dataTransciever, @progress) ->
    @$scope.dataStore = @dataStore
    @$scope.editStore = @_editStore
    @$scope.fields = @FIELDS
    @$scope.up = @_up
    @$scope.down = @_down
    @$scope.remove = @_remove
    @$scope.add = @_add
    @$scope.submit = @_submit
    for key, field of @FIELDS
      @$scope.$watch "dataStore.settings.#{key}", @_onWatchSetting(key)

  _up: (index) =>
    if index is 0 then return
    @_editStore.persons.splice index - 1, 2, @_editStore.persons[index], @_editStore.persons[index - 1]

  _down: (index) =>
    if index >= @_editStore.persons.length - 1 then return
    @_editStore.persons.splice index, 2, @_editStore.persons[index + 1], @_editStore.persons[index]

  _remove: (index) =>
    @_editStore.persons.splice index, 1

  _add: =>
    @_editStore.persons ?= []
    @_editStore.persons.push {name: "Person #{@_editStore.persons.length + 1}"}

  _submit: =>
    @progress.open()
    count = 0
    reParse = false
    reload = false
    async.forEachOfSeries @FIELDS, (field, key, callback) =>
      if JSON.stringify(angular.copy(@_editStore[key])) is JSON.stringify(@dataStore.settings[key])
        return callback()
      if field.reParse then reParse = true
      if field.reload then reload = true
      @progress.set "Saving #{key}...", count++ / Object.keys(@FIELDS).count * 100
      @$http.put '/settings/save', {key: key, value: @_editStore[key]}
      .success =>
        @dataStore.settings[key] = @_editStore[key]
        callback()
      .error => callback "Error saving #{key}"
    , (err) =>
      if err then alert err
      @progress.close()
      async.waterfall [
        (callback) =>
          if reParse
            @dataTransciever.reParse callback
          else
            callback()
        (callback) =>
          if reload
            @dataTransciever.reload callback
          else
            callback()
      ]

  _onWatchSetting: (key) =>
    return =>
      @_editStore[key] = angular.copy(@dataStore.settings?[key])

app.controller 'SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]
module.exports = SettingsController
