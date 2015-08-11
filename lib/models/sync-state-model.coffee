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
  # @param {function} callback
  ###
  loadRemote: (callback) =>
    noteStore = core.users[@_username].client.getNoteStore()
    noteStore.getSyncState callback

module.exports = SyncStateModel
