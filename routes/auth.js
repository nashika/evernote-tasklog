// Generated by CoffeeScript 1.9.3
(function() {
  var Evernote, config, core, express, router;

  express = require('express');

  Evernote = require('evernote').Evernote;

  core = require('../lib/core');

  config = require('../config');

  router = express.Router();

  router.get('/', function(req, res, next) {
    return res.render('auth', {
      title: 'Login'
    });
  });

  router.get('/login', function(req, res, next) {
    var client, envConfig, key, sandbox, token;
    sandbox = req.query.sandbox ? true : false;
    token = req.query.token ? true : false;
    envConfig = sandbox ? config.env.sandbox : config.env.production;
    if (token) {
      key = sandbox ? 'token.sandbox' : 'token.production';
      return core.models.settings.loadLocal(key, function(err, setting) {
        var developerToken;
        if (setting) {
          developerToken = setting.token;
          req.session.evernote = {
            sandbox: sandbox,
            token: developerToken
          };
          return req.session.save(function() {
            return res.redirect('/');
          });
        }
      });
    } else {
      client = new Evernote.Client({
        consumerKey: envConfig.consumerKey,
        consumerSecret: envConfig.consumerSecret,
        sandbox: sandbox
      });
      return client.getRequestToken(req.protocol + "://" + (req.get('host')) + "/auth/callback", function(error, oauthToken, oauthTokenSecret, results) {
        if (error) {
          return res.status(500).send("Error getting OAuth request token : " + JSON.stringify(error));
        }
        req.session.evernote = {
          sandbox: sandbox,
          authTokenSecret: oauthTokenSecret
        };
        return req.session.save(function() {
          return res.redirect(client.getAuthorizeUrl(oauthToken));
        });
      });
    }
  });

  router.get('/callback', function(req, res, next) {
    var client, envConfig, oauthToken, oauthTokenSecret, oauthVerifier, ref, ref1, sandbox;
    oauthToken = req.query['oauth_token'];
    oauthVerifier = req.query['oauth_verifier'];
    oauthTokenSecret = (ref = req.session.evernote) != null ? ref.authTokenSecret : void 0;
    sandbox = (ref1 = req.session.evernote) != null ? ref1.sandbox : void 0;
    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
      res.redirect('/auth');
      return;
    }
    envConfig = sandbox ? config.env.sandbox : config.env.production;
    client = new Evernote.Client({
      consumerKey: envConfig.consumerKey,
      consumerSecret: envConfig.consumerSecret,
      sandbox: sandbox
    });
    return client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      req.session.evernote.token = oauthAccessToken;
      return req.session.save(function() {
        return res.redirect('/');
      });
    });
  });

  router.get('/logout', function(req, res, next) {
    req.session.evernote = void 0;
    return req.session.save(function() {
      return res.redirect('/auth');
    });
  });

  router.all('/token', function(req, res, next) {
    var checkToken, doc, key, ref, ref1, sandbox, token;
    sandbox = ((ref = req.body.sandbox) != null ? ref : req.body.sandbox) ? true : false;
    token = (ref1 = req.body.token) != null ? ref1 : req.query.token;
    checkToken = function(sandbox, token) {
      var _client, _userStore;
      if (!token) {
        return res.json(null);
      }
      _client = new Evernote.Client({
        token: token,
        sandbox: sandbox
      });
      _userStore = _client.getUserStore();
      return _userStore.getUser(function(err, user) {
        if (err) {
          return res.json(null);
        }
        return res.json({
          token: token,
          username: user.username
        });
      });
    };
    key = sandbox ? 'token.sandbox' : 'token.production';
    if (token) {
      doc = {
        token: token
      };
      return core.models.settings.saveLocal(key, doc, (function(_this) {
        return function(err) {
          if (err) {
            return res.status(500).send("Error upsert token : " + (JSON.stringify(err)));
          }
          return checkToken(sandbox, token);
        };
      })(this));
    } else {
      return core.models.settings.loadLocal(key, (function(_this) {
        return function(err, setting) {
          if (err) {
            return res.status(500).send("Error find token: " + (JSON.stringify(err)));
          }
          token = setting ? setting.token : null;
          return checkToken(sandbox, token);
        };
      })(this));
    }
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=auth.js.map