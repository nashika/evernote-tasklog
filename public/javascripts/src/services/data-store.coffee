class DataStoreService

  ###*
  # @public
  # @type {Object}
  ###
  user: null

  ###*
  # @public
  # @type {Array}
  ###
  persons: []

  ###*
  # @public
  # @type {Object}
  ###
  notebooks: {}

  ###*
  # @public
  # @type {Array}
  ###
  stacks: []

  ###*
  # @public
  # @type {Object}
  ###
  notes: {}

  ###*
  # @public
  # @type {Object}
  ###
  timeLogs: {}

  ###*
  # @public
  # @type {Object}
  ###
  profitLogs: {}

  ###*
  # @constructor
  ###
  constructor: ->

app.service 'dataStore', [DataStoreService]
module.exports = DataStoreService
