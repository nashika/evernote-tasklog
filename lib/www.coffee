core = require './core'

class Www

  main: (app, server) ->

    # Core object initialize
    core.app = app
    core.server = server # TODO: Set password to web server
    core.io = require('socket.io').listen(core.server) # TODO: multi user access
    core.www = this
    core.app.locals.core = core

    # Setup Socket.io
    core.io.sockets.on 'connection', @_onConnection # TODO: wait reconnection

  ###*
  # @protected
  # @param socket
  ###
  _onConnection: (socket) =>
    console.log 'a user connected'
    socket.on 'disconnect', @_onDisconnect

  ###*
  # @protected
  ###
  _onDisconnect: =>
    console.log 'user disconnected'

module.exports = new Www()
