import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.users.loadLocal((err, user) => {
        if (err) return res.status(500).send(err);
        res.json(user);
    });
});

export default router;
