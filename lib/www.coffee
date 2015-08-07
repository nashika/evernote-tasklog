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
    # Initialize evernote client
    core.client = new Evernote.Client
      token: config.developerToken
      sandbox: config.sandbox
    async.waterfall [
      # Initialize evernote user
      (callback) =>
        userStore = core.client.getUserStore()
        userStore.getUser callback
      (user, callback) => core.user = user; callback()
      # Initialize database
      (callback) =>
        dbPath = __dirname + '/../db/' + core.user.username + '/'
        core.db.users = new Datastore({filename: dbPath + 'users.db', autoload: true})
        core.db.syncStates = new Datastore({filename: dbPath + 'sync-states.db', autoload: true})
        core.db.notes = new Datastore({filename: dbPath + 'notes.db', autoload: true})
        core.db.notebooks = new Datastore({filename: dbPath + 'notebooks.db', autoload: true})
        core.db.tags = new Datastore({filename: dbPath + 'tags.db', autoload: true})
        core.db.searches = new Datastore({filename: dbPath + 'searches.db', autoload: true})
        core.db.linkedNotebooks = new Datastore({filename: dbPath + 'linked-notebooks.db', autoload: true})
        core.db.timeLogs = new Datastore({filename: dbPath + 'time-logs.db', autoload: true})
        core.db.profitLogs = new Datastore({filename: dbPath + 'profit-logs.db', autoload: true})
        callback()
      # Initialize datas
      (callback) => @sync callback
    ], (err) =>
      if err then return core.loggers.error.error err
      core.loggers.system.info 'Done.'

  ###*
  # @public
  # @param {function} callback
  ###
  sync: (callback) =>
    noteStore = core.client.getNoteStore()
    user = null
    localSyncState = null
    remoteSyncState = null
    lastSyncChunk = null
    async.waterfall [
      (callback) => UserModel::s_loadRemote callback
      (remoteUser, callback) => user = remoteUser; callback()
      (callback) => UserModel::s_saveLocal user, callback
      (callback) => SyncStateModel::s_loadLocal callback
      (syncState, callback) => localSyncState = syncState; callback()
      (callback) => SyncStateModel::s_loadRemote callback
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
            (callback) => NoteModel::s_saveLocal lastSyncChunk.notes, callback
            (callback) => NoteModel::s_removeLocal lastSyncChunk.expungedNotes, callback
            (callback) => NotebookModel::s_saveLocal lastSyncChunk.notebooks, callback
            (callback) => NotebookModel::s_removeLocal lastSyncChunk.expungedNotebooks, callback
            (callback) => TagModel::s_saveLocal lastSyncChunk.tags, callback
            (callback) => TagModel::s_removeLocal lastSyncChunk.expungedTags, callback
            (callback) => SearchModel::s_saveLocal lastSyncChunk.searches, callback
            (callback) => SearchModel::s_removeLocal lastSyncChunk.expungedSearches, callback
            (callback) => LinkedNotebookModel::s_saveLocal lastSyncChunk.linkedNotebooks, callback
            (callback) => LinkedNotebookModel::s_removeLocal lastSyncChunk.expungedLinkedNotebooks, callback
            (callback) => localSyncState.updateCount = lastSyncChunk.chunkHighUSN; callback()
            (callback) => SyncStateModel::s_saveLocal(localSyncState, callback)
            (callback) => core.loggers.system.info "Get sync chunk end. endUSN=#{localSyncState.updateCount}"; callback()
          ], callback
        , (err) =>
          if err then return callback(err)
          core.loggers.system.info "Sync end. localUSN=#{localSyncState.updateCount} remoteUSN=#{remoteSyncState.updateCount}"
          callback()
    ], callback

module.exports = new Www()
