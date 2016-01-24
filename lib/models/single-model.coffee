merge = require 'merge'

core = require '../core'
Model = require './model'

class SingleModel extends Model

  ###*
  # @const
  # @type {Object}
  ###
  DEFAULT_DOC: {}

  ###*
  # @public
  # @param {function} callback
  ###
  loadLocal: (callback) =>
    query = {_id: 1}
    sort = {}
    limit = 1
    core.loggers.system.debug "Load local #{@PLURAL_NAME} was started."
    @_datastore.find(query).sort(sort).limit(limit).exec (err, docs) =>
      core.loggers.system.debug "Load local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.length=#{docs.length}"
      if err then return callback(err)
      doc = if docs.length is 0 then merge(true, @DEFAULT_DOC) else docs[0]
      callback null, doc

  ###*
  # @public
  # @param {Object} doc
  # @param {function} callback
  ###
  saveLocal: (doc, callback) =>
    doc._id = 1
    @_datastore.update {_id: 1}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. numReplaced=#{numReplaced}"
      callback()

module.exports = SingleModel
