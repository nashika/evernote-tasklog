// Generated by CoffeeScript 1.9.3
(function() {
  var config, express, router;

  express = require('express');

  router = express.Router();

  config = require('../config');

  router.get('/', function(req, res, next) {
    return res.json(config.persons);
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=persons.js.map
