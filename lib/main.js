try {
    var electronApp = require('app');
    var BrouserWindow = require('browser-window');
}
catch (e) {
    var electronApp = null;
    var BrowserWindow = null;
}
// Enable Source Map Support
require('source-map-support').install();
// Normalize a port into a number, string, or false.
var normalizePort = function (val) {
    var port = parseInt(val, 10);
    if (isNaN(port))
        return val;
    if (port >= 0)
        return port;
    return false;
};
// Event listener for HTTP server "error" event.
var onError = function (error) {
    if (error.syscall != 'listen')
        throw error;
    var bind = (typeof port == 'string') ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        default:
            throw error;
    }
};
// Event listener for HTTP server "listening" event.
var onListening = function () {
    var addr = server.address();
    var bind = (typeof addr == 'string') ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
};
// Module dependencies.
var expressApp = require('../app');
var debug = require('debug')('evernote-tasklog:server');
var http = require('http');
// Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000');
expressApp.set('port', port);
// Create HTTP server.
var server = http.createServer(expressApp);
// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
// main logic
var www_1 = require('./www');
var www = new www_1["default"]();
www.main(expressApp, server);
// app executed from electron then call electron window
if (electronApp) {
    require('crash-reporter').start();
    var mainWindow = null;
    electronApp.on('window-all-closed', function () {
        if (process.platform != 'darwin')
            electronApp.quit();
    });
    electronApp.on('ready', function () {
        mainWindow = new BrowserWindow({ width: 800, height: 600 });
        mainWindow.loadUrl("http://localhost:#{port}");
        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    });
}
//# sourceMappingURL=main.js.map