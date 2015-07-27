async = require 'async'
merge = require 'merge'

core = require '../core'
config = require '../../config'
MultiModel = require './multi-model'
TimeLogModel = require './time-log-model'
ProfitLogModel = require './profit-log-model'

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
  s_findLocal: (query, callback) =>
    merge query, {deleted: null}
    super query, callback

  ###*
  # @public
  # @static
  # @param {Object} query
  # @param {function} callback
  ###
  s_findLocalWithContent: (query, callback) =>
    @s_findLocal query, (err, notes) =>
      if err then return callback(err)
      results = []
      async.eachSeries notes, (note, callback) =>
        if note.content
          results.push note
          callback()
        else
          @s_loadRemote note.guid, (err, loadNote) =>
            if err then return callback(err)
            results.push loadNote
            callback()
      , (err) =>
        if err then return callback(err)
        callback null, results

  ###*
  # @public
  # @static
  # @param {string} guid
  # @param {function} callback
  ###
  s_loadRemote: (guid, callback) =>
    core.loggers.system.debug "Loading note from remote was started. guid=#{guid}"
    noteStore = core.client.getNoteStore()
    lastNote = null
    async.waterfall [
      (callback) => noteStore.getNote guid, true, false, false, false, callback
      (note, callback) =>
        core.loggers.system.debug "Loading note was succeed. guid=#{note.guid} title=#{note[@TITLE_FIELD]}"
        lastNote = note
        core.loggers.system.debug "Saving note to local. guid=#{note.guid}"
        core.db.notes.update {guid: note.guid}, note, {upsert: true}, callback
      (numReplaced, newDoc..., callback) =>
        core.loggers.system.debug "Saving note was succeed. guid=#{lastNote.guid} numReplaced=#{numReplaced}"
        callback()
      (callback) => @s_parseNote(lastNote, callback)
    ], (err) =>
      if err then return callback(err)
      core.loggers.system.debug "Loading note from remote was finished. note is loaded. guid=#{lastNote.guid} title=#{lastNote.title}"
      callback null, lastNote

  ###*
  # @public
  # @static
  # @param {Object} note
  # @param {function} callback
  ###
  s_parseNote: (note, callback) =>
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
          spentHour = if matches = spentTimeText.match(/(\d+)h/) then parseInt(matches[1]) else 0
          spentMinute = if matches = spentTimeText.match(/(\d+)m/) then parseInt(matches[1]) else 0
          timeLog.spentTime = spentHour * 60 + spentMinute
        if timeLog.date and timeLog.person
          timeLogs.push timeLog
      # parse profit logs
      if matches = clearLine.match(/(.*)[@＠][\\￥](.+)/i)
        profitLogs.push
          noteGuid: note.guid
          comment: matches[1]
          profit: parseInt(matches[2].replace(/,/g, ''))
    async.series [
      (callback) => TimeLogModel::s_removeLocal {noteGuid: note.guid}, callback
      (callback) => ProfitLogModel::s_removeLocal {noteGuid: note.guid}, callback
      (callback) => TimeLogModel::s_saveLocal timeLogs, callback
      (callback) => ProfitLogModel::s_saveLocal profitLogs, callback
    ], (err) =>
      core.loggers.system.trace "Parsing note was #{if err then 'failed' else 'succeed'}. guid=#{note.guid}"
      callback(err)

  ###*
  # @public
  # @static
  ###
  s_findNotesMeta: (words, callback) =>
    noteStore = core.client.getNoteStore()
    noteFilter = new Evernote.NoteFilter()
    if words then noteFilter.words = words
    resultSpec = new Evernote.NotesMetadataResultSpec()
    noteStore.findNotesMetadata noteFilter, 0, 100, resultSpec, (err, notesMeta) =>
      if err then return callback(err)
      callback(null, notesMeta.notes)

module.exports = NoteModel
