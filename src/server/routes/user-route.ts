import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class UserRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.users.loadLocal().then((user) => {
      res.json(user);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
