import express = require("express");
import evernote = require("evernote");

import core from '../core';

var router = express.Router();

// GET home page.
router.get('/', (req, res, next) => {
  if (!(req.session['evernote'] && req.session['evernote'].token)) {
    res.redirect('/auth');
  } else {
    var sandbox: boolean = req.session['evernote'].sandbox;
    var token: string = req.session['evernote'].token;
    var client: evernote.Evernote.Client = new evernote.Evernote.Client({
      token: token,
      sandbox: sandbox,
    });
    var userStore = client.getUserStore();
    userStore.getUser((err, user) => {
      if (err) return res.redirect('/auth');
      req.session['evernote'].user = user;
      req.session.save(() => {
        core.www.initUser(user.username, token, sandbox).then(() => {
          res.render('index', {title: 'Evernote Tasklog'});
        });
      });
    });
  }
});

export default router;
