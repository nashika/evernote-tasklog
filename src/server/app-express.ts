import path = require("path");

import express = require("express");
//import favicon = require("serve-favicon");
import cookieParser = require("cookie-parser");
import session = require("express-session");
import bodyParser = require("body-parser");
import * as sequelize from "sequelize";

import {BaseRoute} from "./routes/base.route";
import {container} from "./inversify.config";

let app: express.Express = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// session store setup
let sessionDatabase = new sequelize("", "", "", {dialect: "sqlite", storage: path.join(__dirname, "../../db/_session.db"), logging: false});
let SequelizeStore = require("connect-session-sequelize")(session.Store);
let sequelizeStore = new SequelizeStore({
  db: sessionDatabase,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 7 * 24 * 60 * 60 * 1000,
});
sequelizeStore.sync();
let sessionMiddleware  = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  store: sequelizeStore,
  name: "realestate2.connect.sid",
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use("/dist", express.static(path.join(__dirname, "../../dist")));
for (let route of container.getAll<BaseRoute>(BaseRoute))
  app.use(route.getBasePath(), route.getRouter());

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
