import path = require("path");

import express = require("express");
//import favicon = require("serve-favicon");
import cookieParser = require("cookie-parser");
import session = require("express-session");
import * as bodyParser from "body-parser";

import {routes} from "./routes/index";

var connectNedbSession = require("connect-nedb-session");

var NedbStore = connectNedbSession(session);
var app:express.Express = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
//app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: "mysecret",
    cookie: {path: "/", httpOnly: true, maxAge: 365 * 24 * 3600 * 1000},
    store: new NedbStore({filename: path.join(__dirname, "../../db/session.db")}),
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, "./public")));
routes(app);

// catch 404 and forward to error handler
app.use((req:express.Request, res:express.Response, next:Function) => {
    var err:any = new Error("Not Found");
    err["status"] = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") == "development") {
    app.use((err:any, req:express.Request, res:express.Response, next:Function) => {
        res.status(err["status"] || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err:any, req:express.Request, res:express.Response, next:Function) => {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

export = app;
