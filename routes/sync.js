"use strict";
var express = require('express');
var core_1 = require('../lib/core');
var router = express.Router();
router.get('/', function (req, res, next) {
    core_1["default"].www.sync(req.session['evernote'].user.username, function (err) {
        if (err)
            return res.status(500).send(err);
        res.json('OK');
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=sync.js.map