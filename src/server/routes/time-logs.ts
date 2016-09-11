import express = require("express");

import core from "../core";
import routeCommon from "./route-common";

var router = express.Router();

router.all('/', (req, res, next) => {
  var params = routeCommon.mergeParams(req);
  core.users[req.session['evernote'].user.username].models.timeLogs.findLocal(params).then(timeLogs => {
    res.json(timeLogs);
  }).catch(err => {
    res.status(500).send(err);
  });
});

router.get('/count', (req, res, next) => {
  core.users[req.session['evernote'].user.username].models.timeLogs.countLocal(req.query).then(count => {
    res.json(count);
  }).catch(err => {
    res.status(500).send(err);
  });
});

export default router;
