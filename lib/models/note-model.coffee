async = require 'async'

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
  # @public
  # @static
  # @param {string} guid
  # @param {function} callback
  ###
  s_loadRemote: (guid, callback) =>
    noteStore = core.client.getNoteStore()
    lastNote = null
    async.waterfall [
      (callback) => noteStore.getNote guid, true, false, false, false, callback
      (note, callback) => lastNote = note; core.db.notes.update {guid: note.guid}, note, {upsert: true}, callback
      (numReplaced, newDoc..., callback) => core.loggers.system.debug "A note is loaded. guid=#{newDoc.guid} title=#{newDoc.title}"; callback()
      (callback) => @_parseNote(lastNote, callback)
    ], callback

  ###*
  # @public
  # @static
  # @param {Object} note
  # @param {function} callback
  ###
  s_parseNote: (note, callback) =>
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
      (callback) =>
        core.db.timeLogs.remove {noteGuid: note.guid}, {multi: true}, (err, numRemoved) =>
          if err then return callback(err)
          core.loggers.system.debug "Remove #{numRemoved} timeLogs."
          callback()
      (callback) =>
        core.db.profitLogs.remove {noteGuid: note.guid}, {multi: true}, (err, numRemoved) =>
          if err then return callback(err)
          core.loggers.system.debug "Remove #{numRemoved} profitLogs."
          callback()
      (callback) =>
        core.db.timeLogs.insert timeLogs, (err, newDocs) =>
          if err then return callback(err)
          core.loggers.system.debug "Insert #{newDocs.length} timeLogs."
          callback()
      (callback) =>
        core.db.profitLogs.insert profitLogs, (err, newDocs) =>
          if err then return callback(err)
          core.loggers.system.debug "Insert #{newDocs.length} profitLogs."
          callback()
    ], (err) =>
      if err then callback(err)
      callback()

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
