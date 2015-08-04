// Generated by CoffeeScript 1.9.3
(function() {
  var BrowserWindow, app, debug, expressApp, http, mainWindow, normalizePort, onError, onListening, port, server, www;

  app = require('app');

  BrowserWindow = require('browser-window');

  normalizePort = function(val) {
    var port;
    port = parseInt(val, 10);
    if (isNaN(port)) {
      return val;
    }
    if (port >= 0) {
      return port;
    }
    return false;
  };

  onError = function(error) {
    var bind;
    if (error.syscall !== 'listen') {
      throw error;
    }
    bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        return process.exit(1);
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        return process.exit(1);
      default:
        throw error;
    }
  };

  onListening = function() {
    var addr, bind;
    addr = server.address();
    bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    return debug('Listening on ' + bind);
  };

  expressApp = require('./app');

  debug = require('debug')('evernote-tasklog:server');

  http = require('http');

  port = normalizePort(process.env.PORT || '8080');

  expressApp.set('port', port);

  server = http.createServer(expressApp);

  server.listen(port);

  server.on('error', onError);

  server.on('listening', onListening);

  www = require('./lib/www');

  www.main(expressApp, server);

  require('crash-reporter').start();

  mainWindow = null;

  app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
      return app.quit();
    }
  });

  app.on('ready', function() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600
    });
    mainWindow.loadUrl('http://localhost:8080');
    return mainWindow.on('closed', function() {
      return mainWindow = null;
    });
  });

}).call(this);

//# sourceMappingURL=main.js.map