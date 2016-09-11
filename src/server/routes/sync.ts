import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
  core.www.sync(req.session['evernote'].user.username).then(() => {
    res.json('OK');
  }).catch(err => {
    return res.status(500).send(err);
  });
});

export default router;
