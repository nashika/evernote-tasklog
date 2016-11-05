import {injectable} from "inversify";

import {BaseServerService} from "./base-server-service";
import {Request} from "express";
import {UserEntity} from "../../common/entity/user-entity";
import {GlobalUserEntity} from "../../common/entity/global-user-entity";

export interface ISession {
  globalUser: GlobalUserEntity;
  user: UserEntity;
}

@injectable()
export class SessionService extends BaseServerService {

  get(req: Request): ISession {
    if (!req.session["evernote"])
      req.session["evernote"] = {};
    return req.session["evernote"];
  }

  clear(req: Request): Promise<void> {
    req.session["evernote"] = null;
    return this.save(req);
  }

  save(req: Request): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
