path = require 'path'

async = require 'async'
log4js = require 'log4js'
Evernote = require('evernote').Evernote
Datastore = require 'nedb'

core = require './core'
config = require '../config'
UserModel = require './models/user-model'
SyncStateModel = require './models/sync-state-model'
NoteModel = require './models/note-model'
NotebookModel = require './models/notebook-model'
TagModel = require './models/tag-model'
SearchModel = require './models/search-model'
LinkedNotebookModel = require './models/linked-notebook-model'

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
        core.users[username].db.users = new Datastore({filename: dbPath + 'users.db', autoload: true})
        core.users[username].db.syncStates = new Datastore({filename: dbPath + 'sync-states.db', autoload: true})
        core.users[username].db.notes = new Datastore({filename: dbPath + 'notes.db', autoload: true})
        core.users[username].db.notebooks = new Datastore({filename: dbPath + 'notebooks.db', autoload: true})
        core.users[username].db.tags = new Datastore({filename: dbPath + 'tags.db', autoload: true})
        core.users[username].db.searches = new Datastore({filename: dbPath + 'searches.db', autoload: true})
        core.users[username].db.linkedNotebooks = new Datastore({filename: dbPath + 'linked-notebooks.db', autoload: true})
        core.users[username].db.timeLogs = new Datastore({filename: dbPath + 'time-logs.db', autoload: true})
        core.users[username].db.profitLogs = new Datastore({filename: dbPath + 'profit-logs.db', autoload: true})
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
      (callback) => UserModel::s_loadRemote username, callback
      (remoteUser, callback) => user = remoteUser; callback()
      (callback) => UserModel::s_saveLocal username, user, callback
      (callback) => SyncStateModel::s_loadLocal username, callback
      (syncState, callback) => localSyncState = syncState; callback()
      (callback) => SyncStateModel::s_loadRemote username, callback
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
            (callback) => NoteModel::s_saveLocal username, lastSyncChunk.notes, callback
            (callback) => NoteModel::s_removeLocal username, lastSyncChunk.expungedNotes, callback
            (callback) => NotebookModel::s_saveLocal username, lastSyncChunk.notebooks, callback
            (callback) => NotebookModel::s_removeLocal username, lastSyncChunk.expungedNotebooks, callback
            (callback) => TagModel::s_saveLocal username, lastSyncChunk.tags, callback
            (callback) => TagModel::s_removeLocal username, lastSyncChunk.expungedTags, callback
            (callback) => SearchModel::s_saveLocal username, lastSyncChunk.searches, callback
            (callback) => SearchModel::s_removeLocal username, lastSyncChunk.expungedSearches, callback
            (callback) => LinkedNotebookModel::s_saveLocal username, lastSyncChunk.linkedNotebooks, callback
            (callback) => LinkedNotebookModel::s_removeLocal username, lastSyncChunk.expungedLinkedNotebooks, callback
            (callback) => localSyncState.updateCount = lastSyncChunk.chunkHighUSN; callback()
            (callback) => SyncStateModel::s_saveLocal username, localSyncState, callback
            (callback) => core.loggers.system.info "Get sync chunk end. endUSN=#{localSyncState.updateCount}"; callback()
          ], callback
        , (err) =>
          if err then return callback(err)
          core.loggers.system.info "Sync end. localUSN=#{localSyncState.updateCount} remoteUSN=#{remoteSyncState.updateCount}"
          callback()
    ], callback

module.exports = new Www()
