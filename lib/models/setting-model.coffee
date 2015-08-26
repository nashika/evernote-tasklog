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
    core.loggers.system.debug "Load local #{@PLURAL_NAME} was started. key=#{key}"
    if key
      query = {_id: key}
      limit = 1
    else
      query = {}
      limit = 0
    @_datastore.find(query).sort({}).limit(limit).exec (err, docs) =>
      core.loggers.system.debug "Load local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.length=#{docs.length}"
      if err then return callback(err)
      if key
        result = if docs.length is 0 then null else docs[0].value
      else
        result = {}
        for doc in docs
          result[doc._id] = doc.value
      callback null, result

  ###*
  # @public
  # @param {Object} doc
  # @param {function} callback
  ###
  saveLocal: (key, value, callback) =>
    doc = {_id: key, value: value}
    @_datastore.update {_id: key}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      if @_username
        core.users[@_username].settings[key] = value
      else
        core.settings[key] = value
      core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. numReplaced=#{numReplaced}"
      callback()

module.exports = SettingModel
