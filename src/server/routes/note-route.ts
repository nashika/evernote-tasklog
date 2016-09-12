import express = require("express");
import {Request, Response, Router} from "express";

import {BaseMultiRoute} from "./base-multi-route";
import {NoteTable} from "../table/note-table";
import {NoteEntity} from "../../common/entity/note-entity";

export class NoteRoute extends BaseMultiRoute<NoteEntity, NoteTable> {

  static EntityClass = NoteEntity;

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/get-content", this.onGetContent);
    _router.post("/re-parse", this.onReParse);
    return _router;
  }

  onGetContent = (req: Request, res: Response) => {
    this.getTable(req).getRemoteContent(req.body).then(notes => {
      res.json(notes);
    }).catch(err => this.responseErrorJson(res, err));
  };

  onReParse = (req: Request, res: Response) => {
    this.getTable(req).reParseNotes(req.body).then(() => {
      res.json(true);
    }).catch(err => this.responseErrorJson(res, err));
  };

}
