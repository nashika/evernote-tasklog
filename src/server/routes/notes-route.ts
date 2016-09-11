import express = require("express");
import {Request, Response, Router} from "express";

import core from "../core";
import {BaseRoute} from "./base-route";

export class NotesRoute extends BaseRoute {

  getRouter(): Router {
    let _router = Router();
    _router.get("/", this.onIndex);
    _router.get("/get-content", this.onGetContent);
    _router.get("/count", this.onCount);
    _router.get("/re-parse", this.onReParse);
    return _router;
  }

  onIndex = (req: Request, res: Response) => {
    core.users[req.session['evernote'].user.username].models.notes.findLocal(req.query).then(notes => {
      res.json(notes);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onGetContent = (req: Request, res: Response) => {
    core.users[req.session['evernote'].user.username].models.notes.getRemoteContent(req.query).then(result => {
      res.json(result);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onCount = (req: Request, res: Response) => {
    core.users[req.session['evernote'].user.username].models.notes.countLocal(req.query).then(count => {
      res.json(count);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onReParse = (req: Request, res: Response) => {
    core.users[req.session['evernote'].user.username].models.notes.reParseNotes(req.query).then(() => {
      res.json(true);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
