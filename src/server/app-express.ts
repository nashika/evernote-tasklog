import path = require("path");

import express = require("express");
//import favicon = require("serve-favicon");
import cookieParser = require("cookie-parser");
import session = require("express-session");
import bodyParser = require("body-parser");

import {container} from "./inversify.config";
import {SocketIoServerService} from "./service/socket-io-server-service";
import {TableService} from "./service/table.service";

let app: express.Express = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// session store setup
let SequelizeStore = require("connect-session-sequelize")(session.Store);
let sequelizeStore = new SequelizeStore({
  db: container.get<TableService>(TableService).getDatabase(),
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 7 * 24 * 60 * 60 * 1000,
});
sequelizeStore.sync();
let sessionMiddleware  = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  store: sequelizeStore,
  name: "evernote-tasklog.connect.sid",
  secret: "keyboard cat",
  resave: true,
  saveUninitialized: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use("/dist", express.static(path.join(__dirname, "../../dist")));

container.get<SocketIoServerService>(SocketIoServerService).sessionMiddleware = sessionMiddleware;

app.get("/", function (_req, res) {
  res.render("index");
});

// catch 404 and forward to error handler
app.use((_req: express.Request, _res: express.Response, next: Function) => {
  var err: any = new Error("Not Found");
  err["status"] = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") == "development") {
  app.use((err: any, _req: express.Request, res: express.Response, _next: Function) => {
    res.status(err["status"] || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, _req: express.Request, res: express.Response, _next: Function) => {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

export = app;
