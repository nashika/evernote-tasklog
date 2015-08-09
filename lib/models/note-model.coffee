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
  APPEND_QUERY: {deleted: null}

  ###*
  # @override
  ###
  s_findLocal: (username, options, callback) =>
    super username, options, (err, notes) =>
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
  # @static
  # @param {string} username
  # @param {Object} query
  # @param {function} callback
  ###
  s_getRemoteContent: (username, options, callback) =>
    options = merge(true, options, {content: true})
    @s_findLocal username, options, (err, notes) =>
      if err then return callback(err)
      result = {count: notes.length, getRemoteContentCount: 0}
      async.eachSeries notes, (note, callback) =>
        if note.content then return callback()
        @s_loadRemote username, note.guid, (err, loadNote) =>
          if err then return callback(err)
          result.getRemoteContentCount++
          callback()
      , (err) =>
        if err then return callback(err)
        callback null, result

  ###*
  # @public
  # @static
  # @param {string} username
  # @param {string} guid
  # @param {function} callback
  ###
  s_loadRemote: (username, guid, callback) =>
    core.loggers.system.debug "Loading note from remote was started. guid=#{guid}"
    noteStore = core.users[username].client.getNoteStore()
    lastNote = null
    async.waterfall [
      (callback) => noteStore.getNote guid, true, false, false, false, callback
      (note, callback) =>
        core.loggers.system.debug "Loading note was succeed. guid=#{note.guid} title=#{note[@TITLE_FIELD]}"
        lastNote = note
        core.loggers.system.debug "Saving note to local. guid=#{note.guid}"
        core.users[username].db.notes.update {guid: note.guid}, note, {upsert: true}, callback
      (numReplaced, newDoc..., callback) =>
        core.loggers.system.debug "Saving note was succeed. guid=#{lastNote.guid} numReplaced=#{numReplaced}"
        callback()
      (callback) => @s_parseNote(username, lastNote, callback)
    ], (err) =>
      if err then return callback(err)
      core.loggers.system.debug "Loading note from remote was finished. note is loaded. guid=#{lastNote.guid} title=#{lastNote.title}"
      callback null, lastNote

  ###*
  # @public
  # @static
  # @param {string} username
  # @param {Object} note
  # @param {function} callback
  ###
  s_parseNote: (username, note, callback) =>
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
      (callback) => TimeLogModel::s_removeLocal username, {noteGuid: note.guid}, callback
      (callback) => ProfitLogModel::s_removeLocal username, {noteGuid: note.guid}, callback
      (callback) => TimeLogModel::s_saveLocal username, timeLogs, callback
      (callback) => ProfitLogModel::s_saveLocal username, profitLogs, callback
    ], (err) =>
      core.loggers.system.trace "Parsing note was #{if err then 'failed' else 'succeed'}. guid=#{note.guid}"
      callback(err)

module.exports = NoteModel
