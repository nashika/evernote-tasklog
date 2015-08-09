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
  # @param {string} username
  # @param {function} callback
  ###
  s_loadRemote: (username, callback) =>
    noteStore = core.users[username].client.getNoteStore()
    noteStore.getSyncState callback

module.exports = SyncStateModel
