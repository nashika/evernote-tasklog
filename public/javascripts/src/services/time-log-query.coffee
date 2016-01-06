merge = require 'merge'

class TimeLogQueryService

  ###*
  # @public
  # @type {number}
  ###
  worked: 3

  ###*
  # @public
  # @type {number}
  ###
  count: null

  ###*
  # @constructor
  # @param {SyncDataService} syncData
  ###
  constructor: (@dataStore) ->

  ###*
  # @public
  # @return {Object}
  ###
  query: =>
    result = {}
    # set worked query
    if @worked
      merge result, {date: {$gte: parseInt(moment().startOf('day').subtract(@worked, 'days').format('x'))}}
    return result

app.service 'timeLogQuery', ['dataStore', TimeLogQueryService]
module.exports = TimeLogQueryService
