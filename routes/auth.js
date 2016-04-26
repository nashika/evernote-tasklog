"use strict";
var express = require('express');
var evernote = require('evernote');
var core_1 = require('../lib/core');
var config_1 = require('../lib/config');
var router = express.Router();
router.get('/', function (req, res, next) {
    res.render('auth', { title: 'Login' });
});
router.get('/login', function (req, res) {
    var sandbox = (req.query.sandbox) ? true : false;
    var token = (req.query.token) ? true : false;
    var envConfig = (sandbox) ? config_1["default"].env.sandbox : config_1["default"].env.production;
    if (token) {
        var key = (sandbox) ? 'token.sandbox' : 'token.production';
        core_1["default"].models.settings.loadLocal(key, function (err, token) {
            if (token) {
                var developerToken = token;
                req.session['evernote'] = {
                    sandbox: sandbox,
                    token: developerToken
                };
                req.session.save(function () {
                    res.redirect('/');
                });
            }
        });
    }
    else {
        var client = new evernote.Evernote.Client({
            consumerKey: envConfig.consumerKey,
            consumerSecret: envConfig.consumerSecret,
            sandbox: sandbox
        });
        client.getRequestToken(req.protocol + "://" + req.get('host') + "/auth/callback", function (error, oauthToken, oauthTokenSecret, results) {
            if (error)
                return res.status(500).send("Error getting OAuth request token : " + JSON.stringify(error));
            req.session['evernote'] = {
                sandbox: sandbox,
                authTokenSecret: oauthTokenSecret
            };
            req.session.save(function () {
                res.redirect;
                client.getAuthorizeUrl(oauthToken);
            });
        });
    }
});
router.get('/callback', function (req, res, next) {
    var oauthToken = req.query['oauth_token'];
    var oauthVerifier = req.query['oauth_verifier'];
    var oauthTokenSecret = req.session['evernote'] ? req.session['evernote'].authTokenSecret : null;
    var sandbox = req.session['evernote'] ? req.session['evernote'].sandbox : null;
    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
        res.redirect('/auth');
        return;
    }
    var envConfig = (sandbox) ? config_1["default"].env.sandbox : config_1["default"].env['production'];
    var client = new evernote.Evernote.Client({
        consumerKey: envConfig.consumerKey,
        consumerSecret: envConfig.consumerSecret,
        sandbox: sandbox
    });
    client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, function (error, oauthAccessToken, oauthAccessTokenSecret, results) {
        req.session['evernote'].token = oauthAccessToken;
        req.session.save(function () {
            res.redirect('/');
        });
    });
});
router.get('/logout', function (req, res, next) {
    req.session['evernote'] = undefined;
    req.session.save(function () {
        res.redirect('/auth');
    });
});
router.all('/token', function (req, res, next) {
    var sandbox = (req.body.sandbox || req.query.token) ? true : false;
    var token = req.body.token || req.query.token;
    var checkToken = function (sandbox, token) {
        if (!token)
            return res.json(null);
        var _client = new evernote.Evernote.Client({
            token: token,
            sandbox: sandbox
        });
        var _userStore = _client.getUserStore();
        _userStore.getUser(function (err, user) {
            if (err)
                return res.json(null);
            res.json({ token: token, username: user.username });
        });
    };
    var key = (sandbox) ? 'token.sandbox' : 'token.production';
    if (token) {
        core_1["default"].models.settings.saveLocal(key, token, function (err) {
            if (err)
                return res.status(500).send("Error upsert token : " + JSON.stringify(err));
            checkToken(sandbox, token);
        });
    }
    else {
        core_1["default"].models.settings.loadLocal(key, function (err, token) {
            if (err)
                return res.status(500).send("Error find token: " + JSON.stringify(err));
            checkToken(sandbox, token);
        });
    }
});
exports.__esModule = true;
exports["default"] = router;
//# sourceMappingURL=auth.js.map