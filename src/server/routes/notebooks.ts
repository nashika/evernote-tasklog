import express = require("express");

import core from "../core";

var router = express.Router();

router.get('/', (req, res, next) => {
    core.users[req.session['evernote'].user.username].models.notebooks.findLocal(req.query, (err, notebooks) => {
        if (err) return res.status(500).send(err);
        res.json(notebooks);
    });
});

export default router;
