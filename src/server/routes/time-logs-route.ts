import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class TimeLogsRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.all("/", this.onIndex);
    _router.get("/count", this.onCount);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    let params = this.mergeParams(req);
    core.users[req.session["evernote"].user.username].models.timeLogs.findLocal(params).then(timeLogs => {
      res.json(timeLogs);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onCount = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.timeLogs.countLocal(req.query).then(count => {
      res.json(count);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
