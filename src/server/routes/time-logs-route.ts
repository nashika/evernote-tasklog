import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class TimeLogsRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
    _router.post("/count", this.onCount);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.timeLogs.find(req.body).then(timeLogs => {
      res.json(timeLogs);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onCount = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.timeLogs.count(req.body).then(count => {
      res.json(count);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
