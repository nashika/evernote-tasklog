import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class ProfitLogsRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    let params = req.query || {};
    core.users[req.session["evernote"].user.username].models.profitLogs.findLocal(params).then(profitLogs => {
      res.json(profitLogs);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
