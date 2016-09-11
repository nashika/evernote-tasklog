import path = require("path");

import express = require("express");
//import favicon = require("serve-favicon");
import cookieParser = require("cookie-parser");
import session = require("express-session");
import * as bodyParser from 'body-parser';
var connectNedbSession = require("connect-nedb-session");

import indexRoute from './routes/index';
import authRoute from './routes/auth';
import notesRoute from './routes/notes';
import notebooksRoute from './routes/notebooks';
import settingsRoute from './routes/settings';
import syncRoute from './routes/sync';
import timeLogsRoute from './routes/time-logs';
import profitLogsRoute from './routes/profit-logs';
import userRoute from './routes/user';

var NedbStore = connectNedbSession(session);
var app:express.Express = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    cookie: {path: '/', httpOnly: true, maxAge: 365 * 24 * 3600 * 1000},
    store: new NedbStore({filename: __dirname + '/db/session.db'}),
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRoute);
app.use('/auth', authRoute);
app.use('/notes', notesRoute);
app.use('/notebooks', notebooksRoute);
app.use('/settings', settingsRoute);
app.use('/sync', syncRoute);
app.use('/time-logs', timeLogsRoute);
app.use('/profit-logs', profitLogsRoute);
app.use('/user', userRoute);
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));

// catch 404 and forward to error handler
app.use((req:express.Request, res:express.Response, next:Function) => {
    var err:any = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') == 'development') {
    app.use((err:any, req:express.Request, res:express.Response, next:Function) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err:any, req:express.Request, res:express.Response, next:Function) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

export = app;
