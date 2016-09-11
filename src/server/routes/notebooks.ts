import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.notebooks.findLocal(req.query).then(notebooks => {
    res.json(notebooks);
  }).catch(err => {
    res.status(500).send(err);
  });
});

export default router;
