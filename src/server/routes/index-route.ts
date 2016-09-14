import express = require("express");
import evernote = require("evernote");
import {Request, Response, Router} from "express";

import {BaseRoute} from "./base-route";

export class IndexRoute extends BaseRoute {

  getBasePath(): string {
    return "/";
  }

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    res.render("index");
  };

}
