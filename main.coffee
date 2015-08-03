app = require 'app'
BrowserWindow = require 'browser-window'


normalizePort = (val) ->
  port = parseInt(val, 10)
  if isNaN(port) then return val
  if port >= 0 then return port
  return false

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

onListening = ->
  addr = server.address()
  bind = if typeof addr is 'string' then 'pipe ' + addr else 'port ' + addr.port
  debug 'Listening on ' + bind

expressApp = require './app'
debug = require('debug')('evernote-tasklog:server')
http = require 'http'

port = normalizePort(process.env.PORT || '8080')
expressApp.set 'port', port

server = http.createServer(expressApp)
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

www = require './lib/www'
www.main expressApp, server



require('crash-reporter').start()

mainWindow = null;

app.on 'window-all-closed', ->
  if process.platform isnt 'darwin'
    app.quit()

app.on 'ready', ->
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadUrl('http://localhost:8080');
  mainWindow.on 'closed', ->
    mainWindow = null
