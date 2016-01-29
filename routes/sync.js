var express = require('express');
var www_1 = require('../lib/www');
var router = express.Router();
router.get('/', function (req, res, next) {
    www_1["default"].sync(req.session['evernote'].user.username, function (err) {
        if (err)
            return res.status(500).send(err);
        res.json('OK');
    });
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=sync.js.map