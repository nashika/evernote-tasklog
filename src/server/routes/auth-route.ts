import express = require("express");
import evernote = require("evernote");

import core from "../core";
import config from "../config";
import {BaseRoute, Code403Error} from "./base-route";
import {Request, Response, Router} from "express";
import {UserTable} from "../table/user-table";
import {SettingEntity} from "../../common/entity/setting-entity";

export class AuthRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
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
        UserTable.loadRemoteFromToken(token, sandbox).then(user => {
          req.session["evernote"].user = user;
          req.session.save((err) => {
            if (err) throw err;
            return core.www.initUser(user.username, token, sandbox).then(() => {
              res.json(true);
            });
          });
        }).catch(err => {
          throw new Code403Error(`Evernote user auth failed. err=${err}`);
        });
      }
    }).catch(err => this.responseErrorJson(res, err));
  };

  onLogin = (req: Request, res: Response) => {
    Promise.resolve().then(() => {
      let sandbox: boolean = req.body.sandbox ? true : false;
      let token: boolean = req.body.token ? true : false;
      let envConfig = sandbox ? config.env.sandbox : config.env.production;
      if (token) {
        let key = sandbox ? "token.sandbox" : "token.production";
        core.models.settings.findOne({_id: key}).then(entity => {
          let resToken: string = entity.value;
          if (resToken) {
            let developerToken = resToken;
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
    }).catch(err => this.responseErrorJson(res, err));
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
    Promise.resolve().then(() => {
      let sandbox: boolean = req.body.sandbox ? true : false;
      let token: string = req.body.token;
      let key = sandbox ? "token.sandbox" : "token.production";
      if (token) {
        let result:any;
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
        });
      }
    }).then(user => {
      res.json(user);
    }).catch(err => this.responseErrorJson(res, err));
  };

  private checkToken(sandbox: boolean, token: string): Promise<{token: string, username: string}> {
    return UserTable.loadRemoteFromToken(token, sandbox).then(user => {
      return {token: token, username: user.username};
    }).catch(err => Promise.reject(new Code403Error(err)));
  };


}
