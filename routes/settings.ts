import * as express from 'express';

import core from '../lib/core';

var router = express.Router();

router.get('/', (req, res, next) => {
    var key = req.query.key || null;
    core.users[req.session['evernote'].user.username].models.settings.loadLocal(key, (err, settings) => {
        if (err) return res.status(500).send(err);
        res.json(settings);
    });
});

router.put('/save', (req, res, next) => {
    if (!req.body.key) return res.status(500).send('No key.');
    core.users[req.session['evernote'].user.username].models.settings.saveLocal(req.body.key, req.body.value, (err) => {
        if (err) return res.status(500).send(err);
        res.json(true);
    });
});

export default router;
