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
    # Initialize core object
    core.app = app
    core.server = server # TODO: Set password to web server
    core.www = this
    core.app.locals.core = core
    # Initialize database
    dbPath = __dirname + '/../db/'
    core.db.notes = new Datastore({filename: dbPath + 'notes.db', autoload: true})
    core.db.timeLogs = new Datastore({filename: dbPath + 'time-logs.db', autoload: true})
    core.db.profitLogs = new Datastore({filename: dbPath + 'profit-logs.db', autoload: true})
    # Initialize evernote client
    core.client = new Evernote.Client
      token: config.developerToken
    # Initialize datas
    dataSource.reloadNotes '', (err) =>
      if err then return console.error err
      console.log 'Done'

module.exports = new Www()
