import * as express from 'express';

import core from '../lib/core';
import routeCommon from './route-common';

var router = express.Router();

router.all('/', (req, res, next) => {
    var params = routeCommon.mergeParams(req);
    core.users[req.session['evernote'].user.username].models.profitLogs.findLocal(params, (err, profitLogs) => {
        if (err) return res.status(500).send(err);
        res.json(profitLogs);
    });
});

export default router;
