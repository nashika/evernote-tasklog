path = require 'path'

async = require 'async'
log4js = require 'log4js'
Evernote = require('evernote').Evernote

core = require './core'
config = require '../config'
LinkedNotebookModel = require './models/linked-notebook-model'
NoteModel = require './models/note-model'
NotebookModel = require './models/notebook-model'
ProfitLogsModel = require './models/profit-log-model'
SearchModel = require './models/search-model'
SettingModel = require './models/setting-model'
SyncStateModel = require './models/sync-state-model'
TagModel = require './models/tag-model'
TimeLogsModel = require './models/time-log-model'
UserModel = require './models/user-model'

class Www

  SYNC_CHUNK_COUNT: 100

  ###*
  # @public
  ###
  main: (app, server) ->
    # Initialize logger
    log4js.configure path.normalize(__dirname + '/../log4js-config.json'), {cwd: path.normalize(__dirname + '/..')}
    core.loggers.system = log4js.getLogger('system')
    core.loggers.access = log4js.getLogger('access')
    core.loggers.error = log4js.getLogger('error')
    # Initialize core object
    core.app = app
    core.server = server # TODO: Set password to web server
    core.www = this
    core.app.locals.core = core
    core.models.settings = new SettingModel()
    core.loggers.system.info 'Initialize web server finished.'

  initUser: (username, token, sandbox, callback) ->
    if core.users[username]
      core.loggers.system.info 'Init user finished. already initialized.'
      return callback()
    core.users[username] = {}
    # Initialize evernote client
    core.users[username].client = new Evernote.Client
      token: token
      sandbox: sandbox
    async.waterfall [
      # Initialize evernote user
      (callback) =>
        userStore = core.users[username].client.getUserStore()
        userStore.getUser callback
      (user, callback) => core.users[username].user = user; callback()
      # Initialize database
      (callback) =>
        core.users[username].db = {}
        dbPath = __dirname + '/../db/' + core.users[username].user.username + '/'
        core.users[username].models =
          users: new UserModel(username)
          syncStates: new SyncStateModel(username)
          notes: new NoteModel(username)
          notebooks: new NotebookModel(username)
          tags: new TagModel(username)
          searches: new SearchModel(username)
          linkedNotebooks: new LinkedNotebookModel(username)
          timeLogs: new TimeLogsModel(username)
          profitLogs: new ProfitLogsModel(username)
        callback()
      # Initialize datas
      (callback) => @sync username, callback
    ], (err) =>
      if err then return core.loggers.error.error err
      core.loggers.system.info "Init user finished. user:#{username} data was initialized."
      callback()

  ###*
  # @public
  # @param {function} callback
  ###
  sync: (username, callback) =>
    noteStore = core.users[username].client.getNoteStore()
    user = null
    localSyncState = null
    remoteSyncState = null
    lastSyncChunk = null
    async.waterfall [
      (callback) => core.users[username].models.users.loadRemote callback
      (remoteUser, callback) => user = remoteUser; callback()
      (callback) => core.users[username].models.users.saveLocal user, callback
      (callback) => core.users[username].models.syncStates.loadLocal callback
      (syncState, callback) => localSyncState = syncState; callback()
      (callback) => core.users[username].models.syncStates.loadRemote callback
      (syncState, callback) => remoteSyncState = syncState; callback()
      (callback) =>
        core.loggers.system.info "Sync start. localUSN=#{localSyncState.updateCount} remoteUSN=#{remoteSyncState.updateCount}"
        async.whilst (=> localSyncState.updateCount < remoteSyncState.updateCount)
        , (callback) =>
          core.loggers.system.info "Get sync chunk start. startUSN=#{localSyncState.updateCount}"
          syncChunkFilter = new Evernote.SyncChunkFilter()
          syncChunkFilter.includeNotes = true
          syncChunkFilter.includeNotebooks = true
          syncChunkFilter.includeTags = true
          syncChunkFilter.includeSearches = true
          syncChunkFilter.includeExpunged = true
          async.waterfall [
            (callback) => noteStore.getFilteredSyncChunk localSyncState.updateCount, @SYNC_CHUNK_COUNT, syncChunkFilter, callback
            (syncChunk, callback) =>
              lastSyncChunk = syncChunk
              callback()
            (callback) => core.users[username].models.notes.saveLocal lastSyncChunk.notes, callback
            (callback) => core.users[username].models.notes.removeLocal lastSyncChunk.expungedNotes, callback
            (callback) => core.users[username].models.notebooks.saveLocal lastSyncChunk.notebooks, callback
            (callback) => core.users[username].models.notebooks.removeLocal lastSyncChunk.expungedNotebooks, callback
            (callback) => core.users[username].models.tags.saveLocal lastSyncChunk.tags, callback
            (callback) => core.users[username].models.tags.removeLocal lastSyncChunk.expungedTags, callback
            (callback) => core.users[username].models.searches.saveLocal lastSyncChunk.searches, callback
            (callback) => core.users[username].models.searches.removeLocal lastSyncChunk.expungedSearches, callback
            (callback) => core.users[username].models.linkedNotebooks.saveLocal lastSyncChunk.linkedNotebooks, callback
            (callback) => core.users[username].models.linkedNotebooks.removeLocal lastSyncChunk.expungedLinkedNotebooks, callback
            (callback) => localSyncState.updateCount = lastSyncChunk.chunkHighUSN; callback()
            (callback) => core.users[username].models.syncStates.saveLocal localSyncState, callback
            (callback) => core.loggers.system.info "Get sync chunk end. endUSN=#{localSyncState.updateCount}"; callback()
          ], callback
        , (err) =>
          if err then return callback(err)
          core.loggers.system.info "Sync end. localUSN=#{localSyncState.updateCount} remoteUSN=#{remoteSyncState.updateCount}"
          callback()
    ], callback

module.exports = new Www()
