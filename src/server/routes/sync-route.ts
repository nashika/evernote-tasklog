import {Request, Response, Router} from "express";
import {injectable} from "inversify";

import {BaseRoute} from "./base-route";
import {SessionService} from "../service/session-service";
import {SyncService} from "../service/sync-service";

@injectable()
export class SyncRoute extends BaseRoute {

  constructor(protected sessionService: SessionService,
              protected syncService: SyncService) {
    super();
  }

  getBasePath(): string {
    return "/sync";
  }

  getRouter(): Router {
    let _router = Router();
    _router.post("/", (req, res) => this.wrap(req, res, this.index));
    _router.post("/update-count", (req, res) => this.wrap(req, res, this.updateCount));
    return _router;
  }

  index(req: Request, _res: Response): Promise<boolean> {
    let session = this.sessionService.get(req);
    return this.syncService.sync(session.globalUser, true).then(() => {
      return true;
    });
  }

  updateCount(req: Request, _res: Response): Promise<number> {
    let session = this.sessionService.get(req);
    return Promise.resolve(this.syncService.updateCount(session.globalUser));
  }

}
