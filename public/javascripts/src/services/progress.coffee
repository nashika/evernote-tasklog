class ProgressFactory

  modalInstance: null
  value: 0
  message: ''

  constructor: (@$modal) ->

  open: =>
    @message = 'processing...'
    @value = 0
    @modalInstance = @$modal.open
      templateUrl: 'progress-modal'
      controller: 'ProgressModalController'
      backdrop: 'static'
      keyboard: false
      size: 'sm'
      animation: false

  close: =>
    @modalInstance.close()

  set: (message, value = null) =>
    @message = message
    if value isnt null
      @value = value

app.service 'progress', ['$modal', ProgressFactory]
module.exports = ProgressFactory
