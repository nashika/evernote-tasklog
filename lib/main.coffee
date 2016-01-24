try
  electronApp = require 'app'
  BrowserWindow = require 'browser-window'
catch e
  electronApp = null
  BrowserWindow = null

# Enable Source Map Support
require('source-map-support').install()

# Normalize a port into a number, string, or false.
normalizePort = (val) ->
  port = parseInt(val, 10)
  if isNaN(port) then return val
  if port >= 0 then return port
  return false

# Event listener for HTTP server "error" event.
onError = (error) ->
  if error.syscall isnt 'listen'
    throw error
  bind = if typeof port is 'string' then 'Pipe ' + port else 'Port ' + port
  switch error.code
    when 'EACCES'
      console.error bind + ' requires elevated privileges'
      process.exit 1
    when 'EADDRINUSE'
      console.error bind + ' is already in use'
      process.exit 1
    else
      throw error

# Event listener for HTTP server "listening" event.
onListening = ->
  addr = server.address()
  bind = if typeof addr is 'string' then 'pipe ' + addr else 'port ' + addr.port
  debug 'Listening on ' + bind

# Module dependencies.
expressApp = require '../app'
debug = require('debug')('evernote-tasklog:server')
http = require 'http'

# Get port from environment and store in Express.
port = normalizePort(process.env.PORT || '3000')
expressApp.set 'port', port

# Create HTTP server.
server = http.createServer(expressApp)

# Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

# main logic
www = require './www'
www.main expressApp, server

# app executed from electron then call electron window
if electronApp
  require('crash-reporter').start()

  mainWindow = null;

  electronApp.on 'window-all-closed', ->
    if process.platform isnt 'darwin'
      electronApp.quit()

  electronApp.on 'ready', ->
    mainWindow = new BrowserWindow({width: 800, height: 600});
    mainWindow.loadUrl("http://localhost:#{port}");
    mainWindow.on 'closed', ->
      mainWindow = null
