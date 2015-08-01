async = require 'async'

class SettingsController

  constructor: (@$scope, @noteFilter) ->
    @$scope.noteFilter = @noteFilter

app.controller 'SettingsController', ['$scope', 'noteFilter', SettingsController]
module.exports = SettingsController
