var express = require('express');
var core_1 = require('../lib/core');
var router = express.Router();
router.get('/', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.notes.findLocal(req.query, function (err, notes) {
        if (err)
            return res.status(500).send(err);
        res.json(notes);
    });
});
router.get('/get-content', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.notes.getRemoteContent(req.query, function (err, result) {
        if (err)
            return res.status(500).send(err);
        res.json(result);
    });
});
router.get('/count', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.notes.countLocal(req.query, function (err, count) {
        if (err)
            return res.status(500).send(err);
        res.json(count);
    });
});
router.get('/re-parse', function (req, res, next) {
    core_1["default"].users[req.session['evernote'].user.username].models.notes.reParseNotes(req.query, function (err) {
        if (err)
            return res.status(500).send(err);
        res.json(true);
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=notes.js.map