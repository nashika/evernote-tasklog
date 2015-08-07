core = require '../core'
SingleModel = require './single-model'

class SyncStateModel extends SingleModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'syncStates'

  ###*
  # @override
  ###
  DEFAULT_DOC: {updateCount: 0}

  ###*
  # @public
  # @static
  # @param {function} callback
  ###
  s_loadRemote: (callback) =>
    noteStore = core.client.getNoteStore()
    noteStore.getSyncState callback

module.exports = SyncStateModel