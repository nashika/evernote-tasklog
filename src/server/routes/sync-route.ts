import express = require("express");
import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseRoute} from "./base-route";
import {SessionService} from "../service/session-service";
import {MainService} from "../service/main-service";

@injectable()
export class SyncRoute extends BaseRoute {

  constructor(protected sessionService: SessionService,
              protected mainService: MainService) {
    super();
  }

  getBasePath(): string {
    return "/sync";
  }

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    return _router;
  }

  index(req: Request, res: Response): Promise<boolean> {
    let session = this.sessionService.get(req);
    return this.mainService.sync(session.user.username).then(() => {
      return true
    });
  };

}
