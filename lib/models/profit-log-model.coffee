async = require 'async'

core = require '../core'
MultiModel = require './multi-model'

class ProfitLogModel extends MultiModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'profitLogs'

  ###*
  # @override
  ###
  TITLE_FIELD: 'comment'

  ###*
  # @override
  ###
  DEFAULT_LIMIT: 2000

  parse: (note, lines, callback) =>
    profitLogs = []
    for line in lines
      if matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)
        profitLogs.push
          noteGuid: note.guid
          comment: matches[1]
          profit: parseInt(matches[2].replace(/,/g, ''))
    async.waterfall [
      (callback) => core.users[@_username].models.profitLogs.removeLocal {noteGuid: note.guid}, callback
      (callback) => core.users[@_username].models.profitLogs.saveLocal profitLogs, callback
    ], callback

module.exports = ProfitLogModel
