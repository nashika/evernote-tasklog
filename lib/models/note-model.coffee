async = require 'async'
merge = require 'merge'

core = require '../core'
MultiModel = require './multi-model'

class NoteModel extends MultiModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'notes'

  ###*
  # @override
  ###
  TITLE_FIELD: 'title'

  ###*
  # @override
  ###
  APPEND_QUERY: {deleted: null}

  ###*
  # @override
  ###
  findLocal: (options, callback) =>
    super options, (err, notes) =>
      if options.content
        callback null, notes
      else
        results = []
        for note in notes
          result = merge(true, note)
          result.hasContent = result.content isnt null
          result.content = null
          results.push result
        callback null, results

  ###*
  # @public
  # @param {Object} query
  # @param {function} callback
  ###
  getRemoteContent: (options, callback) =>
    options = merge(true, options, {content: true})
    @findLocal options, (err, notes) =>
      if err then return callback(err)
      result = {count: notes.length, getRemoteContentCount: 0}
      async.eachSeries notes, (note, callback) =>
        if note.content then return callback()
        @loadRemote note.guid, (err, loadNote) =>
          if err then return callback(err)
          result.getRemoteContentCount++
          callback()
      , (err) =>
        if err then return callback(err)
        callback null, result

  ###*
  # @public
  # @param {string} guid
  # @param {function} callback
  ###
  loadRemote: (guid, callback) =>
    core.loggers.system.debug "Loading note from remote was started. guid=#{guid}"
    noteStore = core.users[@_username].client.getNoteStore()
    lastNote = null
    async.waterfall [
      (callback) => noteStore.getNote guid, true, false, false, false, callback
      (note, callback) =>
        core.loggers.system.debug "Loading note was succeed. guid=#{note.guid} title=#{note[@TITLE_FIELD]}"
        lastNote = note
        core.loggers.system.debug "Saving note to local. guid=#{note.guid}"
        @_datastore.update {guid: note.guid}, note, {upsert: true}, callback
      (numReplaced, newDoc..., callback) =>
        core.loggers.system.debug "Saving note was succeed. guid=#{lastNote.guid} numReplaced=#{numReplaced}"
        callback()
      (callback) => @_parseNote(lastNote, callback)
    ], (err) =>
      if err then return callback(err)
      core.loggers.system.debug "Loading note from remote was finished. note is loaded. guid=#{lastNote.guid} title=#{lastNote.title}"
      callback null, lastNote

  ###*
  # @public
  # @param {function} callback
  ###
  reParseNotes: (options, callback) =>
    options ?= {}
    options.limit = 0
    options.content = true
    @findLocal options, (err, notes) =>
      if err then return callback(err)
      async.eachSeries notes, (note, callback) =>
        @_parseNote note, callback
      , callback

  ###*
  # @protected
  # @param {Object} note
  # @param {function} callback
  ###
  _parseNote: (note, callback) =>
    if not note.content then return callback()
    core.loggers.system.debug "Parsing note was started. guid=#{note.guid}"
    content = note.content
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>')
    lines = []
    for line in content.split('<>')
      lines.push line.replace(/<[^>]*>/g, '')
    async.waterfall [
      (callback) => core.users[@_username].models.timeLogs.parse note, lines, callback
      (callback) => core.users[@_username].models.profitLogs.parse note, lines, callback
    ], (err) =>
      core.loggers.system.debug "Parsing note was #{if err then 'failed' else 'succeed'}. guid=#{note.guid}"
      callback(err)

module.exports = NoteModel
