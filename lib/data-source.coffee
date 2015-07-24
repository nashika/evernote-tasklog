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
    noteFilter = new Evernote.NoteFilter()
    if words then noteFilter.words = words
    resultSpec = new Evernote.NotesMetadataResultSpec()
    noteStore.findNotesMetadata noteFilter, 0, 100, resultSpec, (err, notesMeta) =>
      if err then return callback(err)
      async.eachSeries notesMeta.notes, (noteMeta, callback) =>
        noteStore = core.client.getNoteStore()
        noteStore.getNote noteMeta.guid, true, false, false, false, (err, note) =>
          if err then return callback(err)
          core.db.notes.update {guid: note.guid}, note, {upsert: true}, (err, numReplaced, newDoc) =>
            if err then return callback(err)
            console.log "A note is loaded. guid=#{note.guid} title=#{note.title}"
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
      console.log clearLine
      if matches = clearLine.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)
        timeLog =
          comment: matches[1]
          date: null
          time: null
          person: null
          spentTime: null
        attributesText = matches[2]
        if matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)
          timeLog.date = matches[0]
        if matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/)
          timeLog.time = matches[0]
        for personText in config.personTexts
          if attributesText.indexOf(personText) isnt -1
            timeLog.person = personText
        if matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)
          spentTimeText = matches[0]
          spentHour = if matches = spentTimeText.match(/(\d+)h/) then parseInt(matches[1]) else 0
          spentMinute = if matches = spentTimeText.match(/(\d+)m/) then parseInt(matches[1]) else 0
          spentMinute += spentHour * 60
          timeLog.spentTime = Math.floor(spentMinute / 60) + ':' + (spentMinute % 60)
        if timeLog.date and timeLog.person
          timeLogs.push timeLog
      # parse profit logs
      if matches = clearLine.match(/(.*)[@＠][\\￥](.+)/i)
        profitLogs.push
          comment: matches[1]
          profit: matches[2].toInt()
    console.log JSON.stringify(timeLogs)
    console.log JSON.stringify(profitLogs)
    callback()

module.exports = new DataSource()
