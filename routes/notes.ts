import * as express from 'express';

import core from '../lib/core';

var router = express.Router();

router.get('/', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.notes.findLocal(req.query, (err, notes) => {
        if (err) return res.status(500).send(err);
        res.json(notes)
    });
});

router.get('/get-content', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.notes.getRemoteContent(req.query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

router.get('/count', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.notes.countLocal(req.query, (err, count) => {
        if (err) return res.status(500).send(err);
        res.json(count);
    });
});

router.get('/re-parse', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.notes.reParseNotes(req.query, (err) => {
        if (err) return res.status(500).send(err);
        res.json(true);
    });
});

export default router;
