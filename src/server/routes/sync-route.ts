import express = require("express");
import {Request, Response, Router} from "express";

import {BaseRoute} from "./base-route";
import core from "../core";

export class SyncRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    return _router;
  }

  index(req: Request, res: Response): Promise<boolean> {
    return core.www.sync(req.session["evernote"].user.username).then(() => {
      return true
    });
  };

}
