import * as express from 'express';

import core from '../lib/core';
import routeCommon from './route-common';

var router = express.Router();

router.all('/', (req, res, next) => {
    var params = routeCommon.mergeParams(req);
    core.users[req.session['evernote'].user.username].models.timeLogs.findLocal(params, (err, timeLogs) => {
        if (err) return res.status(500).send(err);
        res.json(timeLogs);
    });
});

router.get('/count', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.timeLogs.countLocal(req.query, (err, count) => {
        if (err) return res.status(500).send(err);
        res.json(count);
    });
});

export default router;
