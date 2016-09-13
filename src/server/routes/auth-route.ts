import express = require("express");
import evernote = require("evernote");
import {injectable, inject} from "inversify";

import core from "../core";
import config from "../config";
import {BaseRoute, Code403Error} from "./base-route";
import {Request, Response, Router} from "express";
import {UserTable} from "../table/user-table";
import {SettingEntity} from "../../common/entity/setting-entity";
import {AuthEntity} from "../../common/entity/auth-entity";
import {SessionService} from "../service/session-service";

@injectable()
export class AuthRoute extends BaseRoute {

  constructor(private sessionService: SessionService) {
    super();
  }

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
    let session = this.sessionService.get(req);
    if (!(session && session.token)) {
      return Promise.resolve(null);
    } else {
      let sandbox: boolean = session.sandbox;
      let token: string = session.token;
      return UserTable.loadRemoteFromToken(token, sandbox).then(user => {
        session.user = user;
        return this.sessionService.save(req);
      }).then(() => {
        return core.www.initUser(session.user.username, token, sandbox);
      }).then(() => {
        let auth = new AuthEntity();
        auth.token = token;
        auth.username = session.user.username;
        return auth;
      }).catch(err => {
        throw new Code403Error(`Evernote user auth failed. err=${err}`);
      });
    }
  }

  login(req: Request, res: Response): Promise<void> {
    let sandbox: boolean = req.body.sandbox ? true : false;
    let token: boolean = req.body.token ? true : false;
    let envConfig = sandbox ? config.env.sandbox : config.env.production;
    if (token) {
      let key = sandbox ? "token.sandbox" : "token.production";
      return core.models.settings.findOne({_id: key}).then(entity => {
        let resToken: string = entity.value;
        if (resToken) {
          let developerToken = resToken;
          this.sessionService.set(req, {
            sandbox: sandbox,
            token: developerToken,
          });
          return this.sessionService.save(req);
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
        if (error) return Promise.reject(`Error getting OAuth request token : ${JSON.stringify(error)}`);
        this.sessionService.set(req, {
          sandbox: sandbox,
          authTokenSecret: oauthTokenSecret,
        });
        return this.sessionService.save(req);
      });
    }
  };

  callback(req: Request, res: Response): Promise<void> {
    let session = this.sessionService.get(req);
    let oauthToken = req.query["oauth_token"];
    let oauthVerifier = req.query["oauth_verifier"];
    let oauthTokenSecret = session ? session.authTokenSecret : null;
    let sandbox = session ? session.sandbox : null;
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
      session.token = oauthAccessToken;
      this.sessionService.save(req).then(() => {
        res.redirect("/");
      });
    });
  }

  logout(req: Request, res: Response): Promise<void> {
    this.sessionService.set(req, null);
    return this.sessionService.save(req);
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
