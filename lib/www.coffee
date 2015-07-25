async = require 'async'
log4js = require 'log4js'
Evernote = require('evernote').Evernote
Datastore = require 'nedb'

core = require './core'
config = require '../config'
dataSource = require './data-source'

class Www

  ###*
  # @public
  ###
  main: (app, server) ->
    # Initialize logger
    log4js.configure '../log4js-config.json', {cwd: '../'}
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
    async.series [
      (callback) =>
        # Initialize evernote user
        userStore = core.client.getUserStore()
        userStore.getUser (err, user) =>
          if err then return callback(err)
          core.user = user
          callback()
      (callback) =>
        # Initialize database
        dbPath = __dirname + '/../db/' + core.user.username + '/'
        core.db.notes = new Datastore({filename: dbPath + 'notes.db', autoload: true})
        core.db.timeLogs = new Datastore({filename: dbPath + 'time-logs.db', autoload: true})
        core.db.profitLogs = new Datastore({filename: dbPath + 'profit-logs.db', autoload: true})
        callback()
      (callback) =>
        # Initialize datas
        dataSource.reloadNotes '', (err) =>
          if err then return callback(err)
          callback()
    ], (err) =>
      if err then return core.loggers.error.error err
      core.loggers.system.info 'Done'

module.exports = new Www()
