import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class NotesRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.post("/", this.onIndex);
    _router.post("/get-content", this.onGetContent);
    _router.post("/count", this.onCount);
    _router.post("/re-parse", this.onReParse);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.notes.find(req.body).then(notes => {
      res.json(notes);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onGetContent = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.notes.getRemoteContent(req.body).then(result => {
      res.json(result);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onCount = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.notes.count(req.body).then(count => {
      res.json(count);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onReParse = (req: Request, res: Response) => {
    core.users[req.session["evernote"].user.username].models.notes.reParseNotes(req.body).then(() => {
      res.json(true);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
