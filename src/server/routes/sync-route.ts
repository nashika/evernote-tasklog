import express = require("express");
import {Request, Response, Router} from "express";

import {BaseRoute} from "./base-route";
import core from "../core";
import {serverServiceRegistry} from "../service/server-service-registry";

export class SyncRoute extends BaseRoute {

  getBasePath(): string {
    return "/sync";
  }

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    return _router;
  }

  index(req: Request, res: Response): Promise<boolean> {
    let session = serverServiceRegistry.session.get(req);
    return core.www.sync(session.user.username).then(() => {
      return true
    });
  };

}
