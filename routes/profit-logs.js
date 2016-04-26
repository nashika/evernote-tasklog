"use strict";
var express = require('express');
var core_1 = require('../lib/core');
var route_common_1 = require('./route-common');
var router = express.Router();
router.all('/', function (req, res, next) {
    var params = route_common_1["default"].mergeParams(req);
    core_1["default"].users[req.session['evernote'].user.username].models.profitLogs.findLocal(params, function (err, profitLogs) {
        if (err)
            return res.status(500).send(err);
        res.json(profitLogs);
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=profit-logs.js.map