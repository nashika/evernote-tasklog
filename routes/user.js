"use strict";
var express = require('express');
var core_1 = require('../lib/core');
var router = express.Router();
router.get('/', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.users.loadLocal(function (err, user) {
        if (err)
            return res.status(500).send(err);
        res.json(user);
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=user.js.map