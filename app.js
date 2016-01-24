var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var connectNedbSession = require('connect-nedb-session');
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
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/notes', require('./routes/notes'));
app.use('/notebooks', require('./routes/notebooks'));
app.use('/settings', require('./routes/settings'));
app.use('/sync', require('./routes/sync'));
app.use('/time-logs', require('./routes/time-logs'));
app.use('/profit-logs', require('./routes/profit-logs'));
app.use('/user', require('./routes/user'));
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