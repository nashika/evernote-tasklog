async = require 'async'
moment = require 'moment'

core = require '../core'
MultiModel = require './multi-model'

class TimeLogModel extends MultiModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'timeLogs'

  ###*
  # @override
  ###
  TITLE_FIELD: 'comment'

  ###*
  # @override
  ###
  DEFAULT_LIMIT: 2000

  parse: (note, lines, callback) =>
    timeLogs = []
    for line in lines
      if matches = line.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)
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
        timeLog.date = parseInt(moment(dateText + ' ' + timeText).format('x'))
        if timeText then timeLog.allDay = false
        # parse person
        for person in core.users[@_username].settings.persons
          if attributesText.indexOf(person.name) isnt -1
            timeLog.person = person.name
        # parse spent time
        if matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)
          spentTimeText = matches[0]
          spentHour = if matches = spentTimeText.match(/(\d+\.?\d*)h/) then parseFloat(matches[1]) else 0
          spentMinute = if matches = spentTimeText.match(/(\d+\.?\d*)m/) then parseFloat(matches[1]) else 0
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute)
        if timeLog.date and timeLog.person
          timeLogs.push timeLog
    async.waterfall [
      (callback) => core.users[@_username].models.timeLogs.removeLocal {noteGuid: note.guid}, callback
      (callback) => core.users[@_username].models.timeLogs.saveLocal timeLogs, callback
    ], callback

module.exports = TimeLogModel
