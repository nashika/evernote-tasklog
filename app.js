"use strict";
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var connectNedbSession = require('connect-nedb-session');
var index_1 = require('./routes/index');
var auth_1 = require('./routes/auth');
var notes_1 = require('./routes/notes');
var notebooks_1 = require('./routes/notebooks');
var settings_1 = require('./routes/settings');
var sync_1 = require('./routes/sync');
var time_logs_1 = require('./routes/time-logs');
var profit_logs_1 = require('./routes/profit-logs');
var user_1 = require('./routes/user');
var NedbStore = connectNedbSession(session);
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    cookie: { path: '/', httpOnly: true, maxAge: 365 * 24 * 3600 * 1000 },
    store: new NedbStore({ filename: __dirname + '/db/session.db' }),
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index_1["default"]);
app.use('/auth', auth_1["default"]);
app.use('/notes', notes_1["default"]);
app.use('/notebooks', notebooks_1["default"]);
app.use('/settings', settings_1["default"]);
app.use('/sync', sync_1["default"]);
app.use('/time-logs', time_logs_1["default"]);
app.use('/profit-logs', profit_logs_1["default"]);
app.use('/user', user_1["default"]);
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') == 'development') {
    app.use(function (err, req, res, next) {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
module.exports = app;
//# sourceMappingURL=app.js.map