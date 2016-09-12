import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class NotebooksRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.users[req.session['evernote'].user.username].models.notebooks.find(req.body).then(notebooks => {
      res.json(notebooks);
    }).catch(err => this.responseErrorJson(res, err));
  }

}
