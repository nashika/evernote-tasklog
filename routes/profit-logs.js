// Generated by CoffeeScript 1.10.0
(function() {
  var core, express, routeCommon, router;

  express = require('express');

  router = express.Router();

  core = require('../lib/core');

  routeCommon = require('./route-common');

  router.all('/', function(req, res, next) {
    var params;
    params = routeCommon.mergeParams(req);
    return core.users[req.session.evernote.user.username].models.profitLogs.findLocal(params, function(err, profitLogs) {
      if (err) {
        return res.status(500).send(err);
      }
      return res.json(profitLogs);
    });
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=profit-logs.js.map
