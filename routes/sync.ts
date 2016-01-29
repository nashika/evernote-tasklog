import * as express from 'express';

import core from '../lib/core';

var router = express.Router();

router.get('/', (req, res, next) => {
    core.www.sync(req.session['evernote'].user.username, (err) => {
        if (err) return res.status(500).send(err);
        res.json('OK');
    });
});

export default router;
