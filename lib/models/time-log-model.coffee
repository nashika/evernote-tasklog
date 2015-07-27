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

module.exports = TimeLogModel
