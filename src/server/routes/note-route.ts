import express = require("express");
import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseMultiRoute} from "./base-multi-route";
import {NoteTable} from "../table/note-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {SessionService} from "../service/session-service";

@injectable()
export class NoteRoute extends BaseMultiRoute<NoteEntity, NoteTable> {

  constructor(protected sessionService: SessionService) {
    super(sessionService);
  }

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/get-content", (req, res) => this.wrap(req, res, this.getContent));
    _router.post("/re-parse", (req, res) => this.wrap(req, res, this.reParse));
    return _router;
  }

  getContent(req: Request, res: Response): Promise<NoteEntity[]> {
    return this.getTable(req).getRemoteContent(req.body).then(notes => {
      return notes;
    });
  }

  reParse(req: Request, res: Response): Promise<boolean> {
    return this.getTable(req).reParseNotes(req.body).then(() => {
      return true;
    });
  };

}
