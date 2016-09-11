import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
  var key = req.query.key || null;
  core.users[req.session['evernote'].user.username].models.settings.loadLocal(key).then(settings => {
    res.json(settings);
  }).catch(err => {
    res.status(500).send(err);
  });
});

router.put('/save', (req, res, next) => {
  if (!req.body.key) return res.status(500).send('No key.');
  core.users[req.session['evernote'].user.username].models.settings.saveLocal(req.body.key, req.body.value).then(() => {
    res.json(true);
  }).catch(err => {
    res.status(500).send(err);
  });
});

export default router;
