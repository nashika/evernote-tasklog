import express = require("express");
import evernote = require("evernote");
import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseRoute} from "./base-route";

@injectable()
export class IndexRoute extends BaseRoute {

  getBasePath(): string {
    return "/";
  }

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    return _router;
  }

  onIndex = (_req: Request, res: Response) => {
    res.render("index");
  };

}
