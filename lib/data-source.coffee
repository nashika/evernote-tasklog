async = require 'async'
Evernote = require('evernote').Evernote

core = require './core'
config = require '../config'

class DataSource

  ###*
  # @public
  # @param {string} words
  # @param {function} callback
  ###
  reloadNotes: (words = null, callback) =>
    noteStore = core.client.getNoteStore()
    clientSyncState = null
    serverSyncState = null
    lastSyncChunk = null
    async.waterfall [
      (callback) => @_loadClientSyncState(callback)
      (syncState, callback) => clientSyncState = syncState; callback()
      (callback) => @_getServerSyncState(callback)
      (syncState, callback) => serverSyncState = syncState; callback()
      (callback) =>
        if clientSyncState.updateCount < serverSyncState.updateCount
          syncChunkFilter = new Evernote.SyncChunkFilter()
          syncChunkFilter.includeNotes = true
          syncChunkFilter.includeExpunged = true
          noteStore.getFilteredSyncChunk clientSyncState.updateCount, 100, syncChunkFilter, (err, syncChunk) =>
            if err then return callback(err)
            lastSyncChunk = syncChunk
            @_storeNotes(syncChunk.notes, callback)
        else
          callback()
      (callback) =>
        if clientSyncState.updateCount < serverSyncState.updateCount
          clientSyncState.updateCount = lastSyncChunk.chunkHighUSN
          @_saveClientSyncState(clientSyncState, callback)
        else
          callback()
    ], (err) =>
      if err then return callback(err)
      callback()

  ###*
  # @protected
  # @param {function} callback
  ###
  _getServerSyncState: (callback) =>
    noteStore = core.client.getNoteStore()
    noteStore.getSyncState (err, syncState) =>
      if err then return callback(err)
      callback(null, syncState)

  ###*
  # @protected
  # @param {function} callback
  ###
  _loadClientSyncState: (callback) =>
    core.db.syncStates.find {_id: 1}, (err, docs) =>
      if err then return callback(err)
      if docs.length is 0
        callback(null, {updateCount: 0})
      else
        callback(null, docs[0])

  _saveClientSyncState: (clientSyncState, callback) =>
    clientSyncState._id = 1
    core.db.syncStates.update {_id: 1}, clientSyncState, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      core.loggers.system.debug "Set client sync state update count to #{clientSyncState.updateCount}"
      callback()

  ###*
  # @protected
  # @param {Array} notesMeta
  # @param {function} callback
  ###
  _storeNotes: (notesMeta, callback) =>
    noteStore = core.client.getNoteStore()
    async.eachSeries notesMeta, (noteMeta, callback) =>
      noteStore.getNote noteMeta.guid, true, false, false, false, (err, note) =>
        if err then return callback(err)
        core.db.notes.update {guid: note.guid}, note, {upsert: true}, (err, numReplaced, newDoc) =>
          if err then return callback(err)
          core.loggers.system.debug "A note is loaded. guid=#{note.guid} title=#{note.title}"
          @_parseNote(note, callback)
    , (err) =>
      if err then return callback(err)
      callback()

  ###*
  # @protected
  # @param {Object} note
  # @param {function} callback
  ###
  _parseNote: (note, callback) =>
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

  _findNotesMeta: (words, callback) =>
    noteStore = core.client.getNoteStore()
    noteFilter = new Evernote.NoteFilter()
    if words then noteFilter.words = words
    resultSpec = new Evernote.NotesMetadataResultSpec()
    noteStore.findNotesMetadata noteFilter, 0, 100, resultSpec, (err, notesMeta) =>
      if err then return callback(err)
      callback(null, notesMeta.notes)

module.exports = new DataSource()
