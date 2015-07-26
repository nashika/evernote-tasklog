core = require '../core'
Model = require './model'

class SyncStateModel extends Model

  ###*
  # @public
  # @static
  # @param {function} callback
  ###
  s_loadRemote: (callback) =>
    noteStore = core.client.getNoteStore()
    noteStore.getSyncState (err, syncState) =>
      if err then return callback(err)
      callback(null, syncState)

  ###*
  # @protected
  # @param {function} callback
  ###
  s_loadLocal: (callback) =>
    core.db.syncStates.find {_id: 1}, (err, docs) =>
      if err then return callback(err)
      if docs.length is 0
        callback(null, {updateCount: 0})
      else
        callback(null, docs[0])

  ###*
  # @protected
  # @param {Object} syncState
  # @param {function} callback
  ###
  s_saveLocal: (syncState, callback) =>
    syncState._id = 1
    core.db.syncStates.update {_id: 1}, syncState, {upsert: true}, (err, numReplaced, newDoc) =>
      if err then return callback(err)
      core.loggers.system.debug "Set client sync state update count to #{syncState.updateCount}"
      callback()

module.exports = SyncStateModel