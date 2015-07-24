Evernote = require('evernote').Evernote

core = require './core'
config = require '../config'

class Www

  ###*
  # @public
  ###
  main: (app, server) ->
    # Core object initialize
    core.app = app
    core.server = server # TODO: Set password to web server
    core.www = this
    core.app.locals.core = core

    core.client = new Evernote.Client
      token: config.developerToken

module.exports = new Www()
