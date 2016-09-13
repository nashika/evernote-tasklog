import express = require("express");
import evernote = require("evernote");

import core from "../core";
import config from "../config";
import {BaseRoute, Code403Error} from "./base-route";
import {Request, Response, Router} from "express";
import {UserTable} from "../table/user-table";
import {SettingEntity} from "../../common/entity/setting-entity";
import {AuthEntity} from "../../common/entity/auth-entity";

export class AuthRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    _router.post("/login", (req, res) => this.wrap(req, res, this.login));
    _router.post("/callback", (req, res) => this.wrap(req, res, this.callback));
    _router.post("/logout", (req, res) => this.wrap(req, res, this.logout));
    _router.post("/token", (req, res) => this.wrap(req, res, this.token));
    return _router;
  }

  index(req: Request, res: Response): Promise<AuthEntity> {
    if (!(req.session["evernote"] && req.session["evernote"].token)) {
      return Promise.resolve(null);
    } else {
      let sandbox: boolean = req.session["evernote"].sandbox;
      let token: string = req.session["evernote"].token;
      return UserTable.loadRemoteFromToken(token, sandbox).then(user => {
        req.session["evernote"].user = user;
        return new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }).then(() => {
        return core.www.initUser(req.session["evernote"].user.username, token, sandbox);
      }).then(() => {
        let auth = new AuthEntity();
        auth.token = token;
        auth.username = req.session["evernote"].user.username;
        return auth;
      }).catch(err => {
        throw new Code403Error(`Evernote user auth failed. err=${err}`);
      });
    }
  }

  login(req: Request, res: Response): Promise<boolean> {
    let sandbox: boolean = req.body.sandbox ? true : false;
    let token: boolean = req.body.token ? true : false;
    let envConfig = sandbox ? config.env.sandbox : config.env.production;
    if (token) {
      let key = sandbox ? "token.sandbox" : "token.production";
      return core.models.settings.findOne({_id: key}).then(entity => {
        let resToken: string = entity.value;
        if (resToken) {
          let developerToken = resToken;
          req.session["evernote"] = {
            sandbox: sandbox,
            token: developerToken,
          };
          return new Promise((resolve, reject) => {
            req.session.save(err => {
              if (err) return reject(err);
              resolve(true);
            });
          });
        } else {
          throw new Code403Error();
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

  callback(req: Request, res: Response): Promise<void> {
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
  }

  logout(req: Request, res: Response): Promise<boolean> {
    return new Promise((resolve, reject) => {
      req.session["evernote"] = undefined;
      req.session.save(err => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }

  token(req: Request, res: Response): Promise<AuthEntity> {
    return Promise.resolve().then(() => {
      let sandbox: boolean = req.body.sandbox ? true : false;
      let token: string = req.body.token;
      let key = sandbox ? "token.sandbox" : "token.production";
      let result: {token: string, username: string};
      if (token) {
        return this.checkToken(sandbox, token).then(user => {
          result = user;
          let setting = new SettingEntity();
          setting._id = key;
          setting.value = token;
          return core.models.settings.save(setting);
        }).then(() => {
          return result;
        });
      } else {
        return core.models.settings.findOne({_id: key}).then(setting => {
          let resToken: string = setting.value;
          if (!resToken) return null;
          return this.checkToken(sandbox, resToken);
        }).then(user => {
          return user;
        }).catch(err => {
          return core.models.settings.remove({_id: key}).then(() => {
            return null;
          });
        });
      }
    }).then(user => {
      return user;
    });
  }

  private checkToken(sandbox: boolean, token: string): Promise<AuthEntity> {
    return UserTable.loadRemoteFromToken(token, sandbox).then(user => {
      let auth = new AuthEntity();
      auth.token = token;
      auth.username = user.username;
      return auth;
    }).catch(err => Promise.reject(new Code403Error(err)));
  }

}
