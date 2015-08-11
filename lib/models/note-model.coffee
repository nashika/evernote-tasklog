async = require 'async'
merge = require 'merge'

core = require '../core'
config = require '../../config'
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
      (callback) => @parseNote(lastNote, callback)
    ], (err) =>
      if err then return callback(err)
      core.loggers.system.debug "Loading note from remote was finished. note is loaded. guid=#{lastNote.guid} title=#{lastNote.title}"
      callback null, lastNote

  ###*
  # @public
  # @param {Object} note
  # @param {function} callback
  ###
  parseNote: (note, callback) =>
    core.loggers.system.trace "Parsing note was started. guid=#{note.guid}"
    content = note.content
    timeLogs = []
    profitLogs = []
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>')
    for line in content.split('<>')
      clearLine = line.replace(/<[^>]*>/g, '')
      # parse time logs
      if matches = clearLine.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)
        timeLog =
          noteGuid: note.guid
          comment: matches[1]
          allDay: true
          date: null
          person: null
          spentTime: null
        attributesText = matches[2]
        # parse date and time
        dateText = if matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/) then matches[0] else ''
        timeText = if matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/) then matches[0] else ''
        timeLog.date = new Date(dateText + ' ' + timeText)
        if timeText then timeLog.allDay = false
        # parse person
        for person in config.persons
          if attributesText.indexOf(person) isnt -1
            timeLog.person = person
        # parse spent time
        if matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)
          spentTimeText = matches[0]
          spentHour = if matches = spentTimeText.match(/(\d+\.?\d*)h/) then parseFloat(matches[1]) else 0
          spentMinute = if matches = spentTimeText.match(/(\d+\.?\d*)m/) then parseFloat(matches[1]) else 0
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute)
        if timeLog.date and timeLog.person
          timeLogs.push timeLog
      # parse profit logs
      if matches = clearLine.match(/(.*)[@＠][\\￥](.+)/i)
        profitLogs.push
          noteGuid: note.guid
          comment: matches[1]
          profit: parseInt(matches[2].replace(/,/g, ''))
    async.series [
      (callback) => core.users[@_username].models.timeLogs.removeLocal {noteGuid: note.guid}, callback
      (callback) => core.users[@_username].models.profitLogs.removeLocal {noteGuid: note.guid}, callback
      (callback) => core.users[@_username].models.timeLogs.saveLocal timeLogs, callback
      (callback) => core.users[@_username].models.profitLogs.saveLocal profitLogs, callback
    ], (err) =>
      core.loggers.system.trace "Parsing note was #{if err then 'failed' else 'succeed'}. guid=#{note.guid}"
      callback(err)

module.exports = NoteModel
