import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseMultiRoute} from "./base-multi.route";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class NoteRoute extends BaseMultiRoute<NoteEntity, NoteTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/get-content", (req, res) => this.wrap(req, res, this.getContent));
    _router.post("/re-parse", (req, res) => this.wrap(req, res, this.reParse));
    return _router;
  }

  getContent(req: Request, _res: Response): Promise<NoteEntity> {
    let guid: string = req.body && req.body.guid;
    if (!guid) return Promise.resolve(null);
    return this.getTable(req).loadRemote(guid).then(note => {
      return note;
    });
  }

  reParse(req: Request, _res: Response): Promise<boolean> {
    return this.getTable(req).reParseNotes(req.body).then(() => {
      return true;
    });
  };

}
