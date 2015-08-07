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

module.exports = ProfitLogModel
