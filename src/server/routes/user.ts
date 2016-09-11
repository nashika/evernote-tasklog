import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.users.loadLocal().then((user) => {
    res.json(user);
  }).catch(err => {
    res.status(500).send(err);
  });
});

export default router;
