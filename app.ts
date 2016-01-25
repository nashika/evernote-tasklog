import * as express from 'express';
import * as path from 'path';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
var connectNedbSession = require('connect-nedb-session');

import indexRoute from './routes/index';
import authRoute from './routes/auth';
import notesRoute from './routes/notes';
import notebooksRoute from './routes/notebooks';
import settingsRoute from './routes/settings';
import syncRoute from './routes/sync';
import timeLogsRoute from './routes/time-logs';
import profitLogsRoute from './routes/profit-logs';
import userRoute from './routes/user';
import {settings} from "cluster";

var NedbStore = connectNedbSession(session);
var app = express();

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
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') == 'development') {
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

export = app;
