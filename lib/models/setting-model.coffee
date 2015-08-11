merge = require 'merge'

core = require '../core'
Model = require './Model'

class SettingModel extends Model

  ###*
  # @override
  ###
  PLURAL_NAME: 'settings'

  ###*
  # @override
  ###
  REQUIRE_USER: false

  ###*
  # @public
  # @param {string} key
  # @param {function} callback
  ###
  loadLocal: (key, callback) =>
    core.loggers.system.debug "Load local #{@PLURAL_NAME} was started."
    @_datastore.find({_id: key}).sort({}).limit(1).exec (err, docs) =>
      core.loggers.system.debug "Load local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.length=#{docs.length}"
      if err then return callback(err)
      doc = if docs.length is 0 then null else docs[0]
      callback null, doc

  ###*
  # @public
  # @param {Object} doc
  # @param {function} callback
  ###
  saveLocal: (key, doc, callback) =>
    doc._id = key
    @_datastore.update {_id: key}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. numReplaced=#{numReplaced}"
      callback()

module.exports = SettingModel
