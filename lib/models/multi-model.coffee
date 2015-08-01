async = require 'async'
merge = require 'merge'

core = require '../core'
Model = require './Model'

class MultiModel extends Model

  ###*
  # @const
  # @type {Object}
  ###
  DEFAULT_QUERY: {}

  ###*
  # @const
  # @type {Object}
  ###
  APPEND_QUERY: {}

  ###*
  # @const
  # @type {Object}
  ###
  DEFAULT_SORT: {updated: -1}

  ###*
  # @const
  # @type {Object}
  ###
  APPEND_SORT: {}

  ###*
  # @const
  # @type {number}
  ###
  DEFAULT_LIMIT: 50

  ###*
  # @public
  # @static
  # @param {Object} options
  # @param {function} callback
  ###
  s_findLocal: (options, callback) =>
    options = @__parseFindOptions(options)
    core.loggers.system.debug "Find local #{@PLURAL_NAME} was started. query=#{JSON.stringify(options.query)}, sort=#{JSON.stringify(options.sort)}, limit=#{options.limit}"
    core.db[@PLURAL_NAME].find(options.query).sort(options.sort).limit(options.limit).exec (err, docs) =>
      core.loggers.system.debug "Find local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.length=#{docs.length}"
      callback(err, docs)

  ###*
  # @public
  # @static
  # @param {Object} options
  # @param {function} callback
  ###
  s_countLocal: (options, callback) =>
    options = @__parseFindOptions(options)
    core.loggers.system.debug "Count local #{@PLURAL_NAME} was started. query=#{JSON.stringify(options.query)}"
    core.db[@PLURAL_NAME].count options.query, (err, count) =>
      core.loggers.system.debug "Count local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. count=#{count}"
      callback(err, count)

  ###*
  # @private
  # @param {Object} options
  # @return {Object}
  ###
  __parseFindOptions: (options) =>
    result = {}
    # Detect options has query only or has some parameters.
    result.query = options.query ? merge(true, @DEFAULT_QUERY)
    result.sort = options.sort ? merge(true, @DEFAULT_SORT)
    result.limit = options.limit ? @DEFAULT_LIMIT
    # If some parameter type is string, convert object.
    for key in ['query', 'sort']
      result[key] = switch typeof result[key]
        when 'object' then result[key]
        when 'string' then JSON.parse(result[key])
        else {}
    # Merge default append parameters.
    merge result.query, @APPEND_QUERY
    merge result.sort, @APPEND_SORT
    return result

  ###*
  # @public
  # @static
  # @param {Array.<Object>|Object} docs
  # @param {function} callback
  ###
  s_saveLocal: (docs, callback) =>
    if not docs or docs.length is 0 then return callback()
    if not Array.isArray(docs) then docs = [docs]
    core.loggers.system.debug "Save local #{@PLURAL_NAME} was started. docs.count=#{docs.length}"
    async.eachSeries docs, (doc, callback) =>
      core.loggers.system.trace "Upsert local #{@PLURAL_NAME} was started. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
      core.db[@PLURAL_NAME].update {guid: doc.guid}, doc, {upsert: true}, (err, numReplaced, newDoc) =>
        core.loggers.system.trace "Upsert local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. guid=#{doc.guid}, numReplaced=#{numReplaced}"
        callback err
    , (err) =>
      core.loggers.system.debug "Save local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.count=#{docs.length}"
      callback(err)

  ###*
  # @public
  # @static
  # @param {Array.<Object>|Object} docs
  # @param {function} callback
  ###
  s_saveLocalUpdateOnly: (docs, callback) =>
    if not docs or docs.length is 0 then return callback()
    if not Array.isArray(docs) then docs = [docs]
    core.loggers.system.debug "Save local update only #{@PLURAL_NAME} was started. docs.count=#{docs.length}"
    async.eachSeries docs, (doc, callback) =>
      localDoc = null
      async.waterfall [
        (callback) => core.db[@PLURAL_NAME].find {guid: doc.guid}, callback
        (docs, callback) =>
          localDoc = if docs.length is 0 then null else docs[0]
          if localDoc and localDoc.updateSequenceNum >= doc.updateSequenceNum
            core.loggers.system.trace "Upsert local #{@PLURAL_NAME} was skipped. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
            callback()
          else
            core.loggers.system.trace "Upsert local #{@PLURAL_NAME} was started. guid=#{doc.guid}, title=#{doc[@TITLE_FIELD]}"
            async.waterfall [
              (callback) => core.db[@PLURAL_NAME].update {guid: doc.guid}, doc, {upsert: true}, callback
              (numReplaced, newDoc..., callback) =>
                core.loggers.system.trace "Upsert local #{@PLURAL_NAME} was succeed. guid=#{doc.guid}, numReplaced=#{numReplaced}"
                callback()
            ], callback
      ], callback
    , (err) =>
      core.loggers.system.debug "Save local update only #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. docs.count=#{docs.length}"
      callback(err)

  ###*
  # @public
  # @static
  # @param {Array.<string>|string|Object} query
  # @param {function} callback
  ###
  s_removeLocal: (query, callback) =>
    if not query then return callback()
    if Array.isArray(query)
      if query.length is 0 then callback()
      query = {guid: {$in: query}}
    if typeof query is 'string'
      query = {guid: query}
    core.loggers.system.debug "Remove local #{@PLURAL_NAME} was started. query=#{JSON.stringify(query)}"
    core.db[@PLURAL_NAME].remove query, {multi: true}, (err, numRemoved) =>
      core.loggers.system.debug "Remove local #{@PLURAL_NAME} was #{if err then 'failed' else 'succeed'}. numRemoved=#{numRemoved}"
      callback(err)

module.exports = MultiModel
