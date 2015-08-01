ModalController = require './modal-controller'

class ProgressModalController extends ModalController

  constructor: (@$scope, @progress) ->
    @$scope.progress = @progress

app.controller 'ProgressModalController', ['$scope', 'progress', ProgressModalController]
module.exports = ProgressModalController
