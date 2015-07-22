// Generated by CoffeeScript 1.9.3
(function() {
  var Evernote, config, express, router;

  express = require('express');

  Evernote = require('evernote').Evernote;

  config = require('../config');

  router = express.Router();


  /* GET home page. */

  router.get('/', function(req, res, next) {
    return res.render('index', {
      title: 'Express'
    });
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=index.js.map
