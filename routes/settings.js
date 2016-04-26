"use strict";
var express = require('express');
var core_1 = require('../lib/core');
var router = express.Router();
router.get('/', function (req, res, next) {
    var key = req.query.key || null;
    core_1["default"].users[req.session['evernote'].user.username].models.settings.loadLocal(key, function (err, settings) {
        if (err)
            return res.status(500).send(err);
        res.json(settings);
    });
});
router.put('/save', function (req, res, next) {
    if (!req.body.key)
        return res.status(500).send('No key.');
    core_1["default"].users[req.session['evernote'].user.username].models.settings.saveLocal(req.body.key, req.body.value, function (err) {
        if (err)
            return res.status(500).send(err);
        res.json(true);
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=settings.js.map