import {BaseServerService} from "./base-server-service";
import {Request} from "express";
import {UserEntity} from "../../common/entity/user-entity";

export interface ISession {
  token?: string;
  sandbox?: boolean;
  user?: UserEntity;
  authTokenSecret?: string;
}

export class SessionService extends BaseServerService {

  public get(req: Request): ISession {
    return req.session["evernote"];
  }

  public set(req: Request, session: ISession): ISession {
    return req.session["evernote"] = session;
  }

  public save(req: Request): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
