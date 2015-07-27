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

module.exports = ProfitLogModel
