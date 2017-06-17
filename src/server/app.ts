/*try {
 var electronApp = require('app');
 var BrouserWindow = require('browser-window');
 } catch (e) {
 var electronApp = null;
 var BrowserWindow = null;
 }*/

// Enable Source Map Support
require('source-map-support').install();

import http = require("http");

import "reflect-metadata";
import {getLogger} from "log4js";
import {Server} from "http";

import "./logger";
import {container} from "./inversify.config";
import {configLoader} from "../common/util/config-loader";
import {MainService} from "./service/main.service";

let logger = getLogger("system");
let port: number = configLoader.app.port;

// Event listener for HTTP server "error" event.
var onError = (error: any) => {
  if (error.syscall != 'listen') throw error;
  var bind = (typeof port == 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Event listener for HTTP server "listening" event.
var onListening = () => {
  var addr = server.address();
  var bind = (typeof addr == 'string') ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
};

// Module dependencies.
var expressApp = require("./app-express");
var debug = require('debug')('evernote-tasklog:server');

// Get port from environment and store in Express.
expressApp.set('port', port);

// Create HTTP server.
var server: Server = http.createServer(expressApp);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);



// main logic
let mainService: MainService = container.get<MainService>(MainService);
mainService.initializeGlobal(server).then(() => {
  logger.info(`Initialize web server finished.`);
  logger.info(`Server address is http://localhost:${port}/`);
}).catch(err => {
  logger.error(`Initialize web server failed. err=${err}`);
  if (err.stack) logger.error(err.stack);
});

// app executed from electron then call electron window
/*if (electronApp) {
 require('crash-reporter').start();

 var mainWindow = null;

 electronApp.on('window-all-closed', () => {
 if (process.platform != 'darwin') electronApp.quit();
 });

 electronApp.on('ready', () => {
 mainWindow = new BrowserWindow({width: 800, height: 600});
 mainWindow.loadUrl("http://localhost:#{port}");
 mainWindow.on('closed', () => {
 mainWindow = null;
 });
 });
 }
 */
