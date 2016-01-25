var express = require('express');
var evernote_1 = require('evernote');
var core_1 = require('../lib/core');
var router = express.Router();
// GET home page.
router.get('/', function (req, res, next) {
    if (!(req.session['evernote'] && req.session['evernote'].token)) {
        res.redirect('/auth');
    }
    else {
        var sandbox = req.session['evernote'].sandbox;
        var token = req.session['evernote'].token;
        var client = new evernote_1.Evernote.Client({
            token: token,
            sandbox: sandbox
        });
        var userStore = client.getUserStore();
        userStore.getUser(function (err, user) {
            if (err)
                return res.redirect('/auth');
            req.session['evernote'].user = user;
            req.session.save(function () {
                core_1["default"].www.initUser(user.username, token, sandbox, function () {
                    res.render('index', { title: 'Evernote Tasklog' });
                });
            });
        });
    }
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=index.js.map