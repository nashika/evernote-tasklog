MultiModel = require './multi-model'

class NotebookModel extends MultiModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'notebooks'

  ###*
  # @override
  ###
  DEFAULT_SORT: {stack: 1, name: 1}

module.exports = NotebookModel
