"use strict";
var express = require('express');
var core_1 = require('../lib/core');
var route_common_1 = require('./route-common');
var router = express.Router();
router.all('/', function (req, res, next) {
    var params = route_common_1["default"].mergeParams(req);
    core_1["default"].users[req.session['evernote'].user.username].models.timeLogs.findLocal(params, function (err, timeLogs) {
        if (err)
            return res.status(500).send(err);
        res.json(timeLogs);
    });
});
router.get('/count', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.timeLogs.countLocal(req.query, function (err, count) {
        if (err)
            return res.status(500).send(err);
        res.json(count);
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=time-logs.js.map