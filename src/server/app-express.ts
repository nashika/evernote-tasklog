import path = require("path");

import express = require("express");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");

let app: express.Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use((_req: express.Request, _res: express.Response, next: Function) => {
  var err: any = new Error("Not Found");
  err["status"] = 404;
  next(err);
});

// error handlers

