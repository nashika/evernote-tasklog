import express = require("express");
import {Request, Response, Router} from "express";

import {BaseRoute} from "./base-route";
import core from "../core";

export class SyncRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.www.sync(req.session['evernote'].user.username).then(() => {
      res.json('OK');
    }).catch(err => this.responseErrorJson(res, err));
  };

}
