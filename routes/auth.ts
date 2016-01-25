import * as express from 'express';
import {Evernote} from 'evernote';

import core from '../lib/core';
import config from '../lib/config';

var router = express.Router();

router.get('/', (req, res, next) => {
    res.render('auth', {title: 'Login'});
});

router.get('/login', (req, res, next) => {
    var sandbox:boolean = (req.query.sandbox) ? true : false;
    var token:boolean = (req.query.token) ? true : false;
    var envConfig = (sandbox) ? config.env.sandbox : config.env['production'];
    if (token) {
        var key = (sandbox) ? 'token.sandbox' : 'token.production';
        core.models.settings.loadLocal(key, (err, token) => {
            if (token) {
                var developerToken = token;
                req.session['evernote'] = {
                    sandbox: sandbox,
                    token: developerToken,
                };
                req.session.save(() => {
                    res.redirect('/');
                });
            }
        });
    } else {
        var client:any = new Evernote.Client({
            consumerKey: envConfig.consumerKey,
            consumerSecret: envConfig.consumerSecret,
            sandbox: sandbox,
        });
        client.getRequestToken(`${req.protocol}://${req.get('host')}/auth/callback`, (error, oauthToken, oauthTokenSecret, results) => {
            if (error) return res.status(500).send(`Error getting OAuth request token : ${JSON.stringify(error)}`);
            req.session['evernote'] = {
                sandbox: sandbox,
                authTokenSecret: oauthTokenSecret,
            };
            req.session.save(() => {
                res.redirect
                client.getAuthorizeUrl(oauthToken);
            });
        });
    }
});

router.get('/callback', (req, res, next) => {
    var oauthToken = req.query['oauth_token'];
    var oauthVerifier = req.query['oauth_verifier'];
    var oauthTokenSecret = req.session['evernote'] ? req.session['evernote'].authTokenSecret : null;
    var sandbox = req.session['evernote'] ? req.session['evernote'].sandbox : null;
    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
        res.redirect('/auth');
        return;
    }
    var envConfig = (sandbox) ? config.env.sandbox : config.env['production'];
    var client:any = new Evernote.Client({
        consumerKey: envConfig.consumerKey,
        consumerSecret: envConfig.consumerSecret,
        sandbox: sandbox,
    });
    client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        req.session['evernote'].token = oauthAccessToken;
        req.session.save(() => {
            res.redirect('/');
        });
    });
});

router.get('/logout', (req, res, next) => {
    req.session['evernote'] = undefined;
    req.session.save(() => {
        res.redirect('/auth');
    });
});

router.all('/token', (req, res, next) => {
    var sandbox:boolean = (req.body.sandbox || req.query.token) ? true : false;
    var token:string = req.body.token || req.query.token;
    var checkToken = (sandbox, token) => {
        if (!token) return res.json(null);
        var _client = new Evernote.Client({
            token: token,
            sandbox: sandbox,
        });
        var _userStore = _client.getUserStore();
        _userStore.getUser((err, user) => {
            if (err) return res.json(null);
            res.json({token: token, username: user.username});
        });
    };
    var key = (sandbox) ? 'token.sandbox' : 'token.production';
    if (token) {
        core.models.settings.saveLocal(key, token, (err) => {
            if (err) return res.status(500).send(`Error upsert token : ${JSON.stringify(err)}`);
            checkToken(sandbox, token);
        });
    } else {
        core.models.settings.loadLocal(key, (err, token) => {
            if (err) return res.status(500).send(`Error find token: ${JSON.stringify(err)}`);
            checkToken(sandbox, token);
        });
    }
});

export default router;
