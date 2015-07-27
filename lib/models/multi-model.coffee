async = require 'async'
merge = require 'merge'

core = require '../core'
Model = require './Model'

class MultiModel extends Model

  ###*
  # @protected
  # @static
  # @param {Object} query
  # @param {function} callback
  ###
  s_findLocal: (query, callback) =>
    merge query, {deleted: null}
    sort = {updated: -1}
    limit = 50
    core.db[@PLURAL_NAME].find(query).sort(sort).limit(limit).exec callback

  ###*
  # @public
  # @static
  # @param {Array.<Object>|Object} docs
  # @param {function} callback
  ###
  s_saveLocal: (docs, callback) =>
    if not docs or docs.length is 0 then return callback()
    if not Array.isArray(docs) then docs = [docs]
    core.loggers.system.debug "Save local #{@PLURAL_NAME} start. docs.count=#{docs.length}"
    async.eachSeries docs, (doc, callback) =>
      localDoc = null
      async.waterfall [
        (callback) => core.db[@PLURAL_NAME].find {guid: doc.guid}, callback
        (docs, callback) =>
          localDoc = if docs.length is 0 then null else docs[0]
          if localDoc and localDoc.updateSequenceNum >= doc.updateSequenceNum
            core.loggers.system.debug "Upsert #{@PLURAL_NAME} skipped. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
            callback()
          else
            core.loggers.system.debug "Upsert #{@PLURAL_NAME} start. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
            async.waterfall [
              (callback) => core.db[@PLURAL_NAME].update {guid: doc.guid}, doc, {upsert: true}, callback
              (numReplaced, newDoc..., callback) =>
                core.loggers.system.debug "Upsert #{@PLURAL_NAME} end. guid=#{doc.guid}, numReplaced=#{numReplaced}"
                callback()
            ], callback
      ], callback
    , callback

  ###*
  # @public
  # @static
  # @param {Array.<string>|string} guids
  # @param {function} callback
  ###
  s_removeLocal: (guids, callback) =>
    if not guids or guids.length is 0 then return callback()
    if not Array.isArray(guids) then guids = [guids]
    core.loggers.system.debug "Remove local #{@PLURAL_NAME} start. guids.count=#{guids.length}"
    core.db[@PLURAL_NAME].remove {guid: {$in: guids}}, (err, numRemoved) =>
      if err then return callback(err)
      core.loggers.system.debug "Remove local #{@PLURAL_NAME} end. numRemoved=#{numRemoved}"
      callback()

module.exports = MultiModel
