import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class NoteRoute extends BaseEntityRoute<NoteEntity, NoteTable> {

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

  async getContent(req: Request, _res: Response): Promise<NoteEntity> {
    let guid: string = req.body && req.body.guid;
    if (!guid) return Promise.resolve(null);
    let note = await this.getTable(req).loadRemote(guid);
    return note;
  }

  async reParse(req: Request, _res: Response): Promise<boolean> {
    await this.getTable(req).reParseNotes(req.body);
    return true;
  }

}
