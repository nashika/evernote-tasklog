import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class SettingsRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
    _router.post("/save", this.onSave);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    let key = req.body.key || null;
    core.users[req.session["evernote"].user.username].models.settings.find({query: key ? {key: key} : {}}).then(settings => {
      res.json(settings);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onSave = (req: Request, res: Response) => {
    if (!req.body.key) return this.responseErrorJson(res, "No key.");
    core.users[req.session["evernote"].user.username].models.settings.saveLocal(req.body.key, req.body.value).then(() => {
      res.json(true);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
