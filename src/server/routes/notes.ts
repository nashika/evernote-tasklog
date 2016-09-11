import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.notes.findLocal(req.query).then(notes => {
    res.json(notes);
  }).catch(err => {
    res.status(500).send(err);
  });
});

router.get('/get-content', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.notes.getRemoteContent(req.query).then(result => {
    res.json(result);
  }).catch(err => {
    return res.status(500).send(err);
  });
});

router.get('/count', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.notes.countLocal(req.query).then(count => {
    res.json(count);
  }).catch(err => {
    return res.status(500).send(err);
  });
});

router.get('/re-parse', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.notes.reParseNotes(req.query).then(() => {
    res.json(true);
  }).catch(err => {
    res.status(500).send(err);
  });
});

export default router;
