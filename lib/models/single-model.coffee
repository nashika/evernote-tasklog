merge = require 'merge'

core = require '../core'
Model = require './Model'

class SingleModel extends Model

  ###*
  # @const
  # @type {Object}
  ###
  DEFAULT_DOC: {}

  ###*
  # @protected
  # @static
  # @param {function} callback
  ###
  s_loadLocal: (callback) =>
    query = {_id: 1}
    sort = {}
    limit = 1
    core.loggers.system.debug "Load local #{@PLURAL_NAME} was started."
    core.db[@PLURAL_NAME].find(query).sort(sort).limit(limit).exec (err, docs) =>
      core.loggers.system.debug "Load local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.length=#{docs.length}"
      if err then return callback(err)
      if docs.length is 0
        callback null, merge(true, @DEFAULT_DOC)
      else
        callback null, docs[0]

  ###*
  # @protected
  # @param {Object} doc
  # @param {function} callback
  ###
  s_saveLocal: (doc, callback) =>
    doc._id = 1
    core.db[@PLURAL_NAME].update {_id: 1}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. numReplaced=#{numReplaced}"
      callback()

module.exports = SingleModel
