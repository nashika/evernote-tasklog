import express = require("express");
import evernote = require("evernote");

import core from "../core";
import config from "../config";
import {UserEntity} from "../../common/entity/user-entity";
import {BaseRoute, Code403Error} from "./base-route";
import {Request, Response, Router} from "express";

export class AuthRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    _router.post("/login", this.onLogin);
    _router.post("/callback", this.onCallback);
    _router.post("/logout", this.onLogout);
    _router.post("/token", this.onToken);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    Promise.resolve().then(() => {
      if (!(req.session["evernote"] && req.session["evernote"].token)) {
        res.json(false);
      } else {
        let sandbox: boolean = req.session["evernote"].sandbox;
        let token: string = req.session["evernote"].token;
        let client: evernote.Evernote.Client = new evernote.Evernote.Client({
          token: token,
          sandbox: sandbox,
        });
        var userStore = client.getUserStore();
        userStore.getUser((err, user) => {
          if (err) throw new Code403Error(`Evernote user auth failed.`);
          req.session["evernote"].user = user;
          req.session.save((err) => {
            if (err) throw err;
            core.www.initUser(user.username, token, sandbox).then(() => {
              res.json(true);
            });
          });
        });
      }
    }).catch(err => this.responseErrorJson(res, err));
  };

  onLogin = (req: Request, res: Response) => {
    let sandbox: boolean = req.body.sandbox ? true : false;
    let token: boolean = req.body.token ? true : false;
    let envConfig = sandbox ? config.env.sandbox : config.env.production;
    if (token) {
      let key = sandbox ? "token.sandbox" : "token.production";
      core.models.settings.loadLocal(key).then(token => {
        if (token) {
          var developerToken = token;
          req.session["evernote"] = {
            sandbox: sandbox,
            token: developerToken,
          };
          req.session.save(() => {
            res.json(true);
          });
        }
      });
    } else {
      var client: any = new evernote.Evernote.Client({
        consumerKey: envConfig.consumerKey,
        consumerSecret: envConfig.consumerSecret,
        sandbox: sandbox,
      });
      client.getRequestToken(`${req.protocol}://${req.get("host")}/auth/callback`, (error: Error, oauthToken: string, oauthTokenSecret: string, results: any) => {
        if (error) return res.status(500).send(`Error getting OAuth request token : ${JSON.stringify(error)}`);
        req.session["evernote"] = {
          sandbox: sandbox,
          authTokenSecret: oauthTokenSecret,
        };
        req.session.save(() => {
          res.redirect(client.getAuthorizeUrl(oauthToken));
        });
      });
    }
  };

  onCallback = (req: Request, res: Response) => {
    var oauthToken = req.query["oauth_token"];
    var oauthVerifier = req.query["oauth_verifier"];
    var oauthTokenSecret = req.session["evernote"] ? req.session["evernote"].authTokenSecret : null;
    var sandbox = req.session["evernote"] ? req.session["evernote"].sandbox : null;
    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
      res.redirect("/auth");
      return;
    }
    var envConfig = (sandbox) ? config.env.sandbox : config.env["production"];
    var client: any = new evernote.Evernote.Client({
      consumerKey: envConfig.consumerKey,
      consumerSecret: envConfig.consumerSecret,
      sandbox: sandbox,
    });
    client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error: Error, oauthAccessToken: string, oauthAccessTokenSecret: string, results: any) => {
      req.session["evernote"].token = oauthAccessToken;
      req.session.save(() => {
        res.redirect("/");
      });
    });
  };

  onLogout = (req: Request, res: Response) => {
    Promise.resolve().then(() => {
      req.session["evernote"] = undefined;
      req.session.save(err => {
        if (err) throw err;
        res.json(true);
      });
    }).catch(err => this.responseErrorJson(res, err));
  };

  onToken = (req: Request, res: Response) => {
    var sandbox: boolean = req.body.sandbox ? true : false;
    var token: string = req.body.token;
    var checkToken = (sandbox: boolean, token: string) => {
      if (!token) return res.json(null);
      var _client = new evernote.Evernote.Client({
        token: token,
        sandbox: sandbox,
      });
      var _userStore: evernote.Evernote.UserStoreClient = _client.getUserStore();
      _userStore.getUser((err: Error, user: UserEntity) => {
        if (err) return res.json(null);
        res.json({token: token, username: user.username});
      });
    };
    var key = (sandbox) ? "token.sandbox" : "token.production";
    if (token) {
      core.models.settings.saveLocal(key, token).then(() => {
        checkToken(sandbox, token);
      }).catch(err => this.responseErrorJson(res, err));
    } else {
      core.models.settings.loadLocal(key).then(token => {
        checkToken(sandbox, token);
      }).catch(err => this.responseErrorJson(res, err));
    }
  }

}
