async = require 'async'

core = require '../core'

class Model

  ###*
  # @const
  # @type {string}
  ###
  PLURAL_NAME: ''

  ###*
  # @const
  # @type {string}
  ###
  TITLE_FIELD: ''

  ###*
  # @public
  # @static
  # @param {Array} docs
  # @param {function} callback
  ###
  s_saveLocal: (docs, callback) =>
    if not docs or docs.length is 0 then return callback()
    core.loggers.system.debug "Save local #{@PLURAL_NAME} start. docs.count=#{docs.length}"
    async.eachSeries docs, (doc, callback) =>
      core.loggers.system.debug "Upsert #{@PLURAL_NAME} start. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
      core.db[@PLURAL_NAME].update {guid: doc.guid}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
        if err then return callback(err)
        core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. guid=#{doc.guid}, numReplaced=#{numReplaced}"
        callback()
    , callback

  ###*
  # @public
  # @static
  # @param {Array.<string>} guids
  # @param {function} callback
  ###
  s_removeLocal: (guids, callback) =>
    if not guids or guids.length is 0 then return callback()
    core.loggers.system.debug "Remove local #{@PLURAL_NAME} start. guids.count=#{guids.length}"
    core.db[@PLURAL_NAME].remove {guid: {$in: guids}}, (err, numRemoved) =>
      if err then return callback(err)
      core.loggers.system.debug "Remove local #{@PLURAL_NAME} end. numRemoved=#{numRemoved}"
      callback()

module.exports = Model
