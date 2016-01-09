class ProgressService

  modalInstance: null

  value: 0

  completeCount: 0

  allCount: 0

  message: ''

  constructor: (@$modal) ->

  open: (allCount) =>
    @message = 'processing...'
    @value = 0
    @completeCount = 0
    @allCount = allCount
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

  next: (message) =>
    @completeCount++
    @set message, @completeCount / @allCount * 100

app.service 'progress', ['$modal', ProgressService]
module.exports = ProgressService
