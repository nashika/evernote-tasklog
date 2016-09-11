import express = require("express");

import core from "../core";
import routeCommon from "./route-common";

var router = express.Router();

router.all('/', (req, res, next) => {
    var params = routeCommon.mergeParams(req);
    core.users[req.session['evernote'].user.username].models.profitLogs.findLocal(params).then(profitLogs => {
      res.json(profitLogs);
    }).catch(err => {
      res.status(500).send(err);
    });
});

export default router;
