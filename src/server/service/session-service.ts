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
    return req.session["evernote"];
  }

  set(req: Request, session: ISession): ISession {
    return req.session["evernote"] = session;
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
