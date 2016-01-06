// Generated by CoffeeScript 1.10.0
(function() {
  var NedbStore, app, bodyParser, cookieParser, express, favicon, logger, path, session;

  express = require('express');

  path = require('path');

  favicon = require('serve-favicon');

  logger = require('morgan');

  cookieParser = require('cookie-parser');

  session = require('express-session');

  bodyParser = require('body-parser');

  NedbStore = require('connect-nedb-session')(session);

  app = express();

  app.set('views', path.join(__dirname, 'views'));

  app.set('view engine', 'jade');

  app.use(logger('dev'));

  app.use(bodyParser.json());

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.use(cookieParser());

  app.use(session({
    secret: 'mysecret',
    key: 'mysessionkey',
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 365 * 24 * 3600 * 1000
    },
    store: new NedbStore({
      filename: __dirname + '/db/session.db'
    }),
    resave: false,
    saveUninitialized: false
  }));

  app.use(express["static"](path.join(__dirname, 'public')));

  app.use('/', require('./routes/index'));

  app.use('/auth', require('./routes/auth'));

  app.use('/notes', require('./routes/notes'));

  app.use('/notebooks', require('./routes/notebooks'));

  app.use('/settings', require('./routes/settings'));

  app.use('/sync', require('./routes/sync'));

  app.use('/time-logs', require('./routes/time-logs'));

  app.use('/profit-logs', require('./routes/profit-logs'));

  app.use('/user', require('./routes/user'));

  app.use('/bower_components', express["static"](path.join(__dirname, '/bower_components')));

  app.use(function(req, res, next) {
    var err;
    err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });

  module.exports = app;

}).call(this);

//# sourceMappingURL=app.js.map
