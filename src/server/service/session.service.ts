import {injectable} from "inversify";
import {Evernote} from "evernote";

import {BaseServerService} from "./base-server.service";
import {Request} from "express";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";

export interface ISession {
  globalUser: GlobalUserEntity;
  user: Evernote.User;
}

@injectable()
export class SessionService extends BaseServerService {

  get(req: Request): ISession {
    if (!req.session["evernote"])
      req.session["evernote"] = {};
    return req.session["evernote"];
  }

  async clear(req: Request): Promise<void> {
    req.session["evernote"] = null;
    await this.save(req);
  }

  async save(req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
