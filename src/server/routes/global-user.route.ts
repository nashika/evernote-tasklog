import {Router, Request, Response} from "express";
import {injectable} from "inversify";

import {TableService} from "../service/table.service";
import {EvernoteClientService} from "../service/evernote-client.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {BaseMultiRoute} from "./base-multi.route";
import {GlobalUserTable} from "../table/global-user.table";
import {Code403Error} from "./base.route";
import {SessionService} from "../service/session.service";
import {UserEntity} from "../../common/entity/user.entity";

@injectable()
export class GlobalUserRoute extends BaseMultiRoute<GlobalUserEntity, GlobalUserTable> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

  getRouter(): Router {
    let _router = super.getRouter();
    _router.post("/load", (req, res) => this.wrap(req, res, this.load));
    _router.post("/change", (req, res) => this.wrap(req, res, this.change));
    _router.post("/auth", (req, res) => this.wrap(req, res, this.auth));
    _router.post("/logout", (req, res) => this.wrap(req, res, this.logout));
    return _router;
  }

  async load(req: Request, _res: Response): Promise<GlobalUserEntity> {
    let session = this.sessionService.get(req);
    return session.globalUser && session.globalUser.id ? session.globalUser : null;
  }

  async change(req: Request, _res: Response): Promise<void> {
    let globalUser: GlobalUserEntity = new GlobalUserEntity(req.body);
    let session = this.sessionService.get(req);
    session.globalUser = globalUser;
    await this.sessionService.save(req);
  }

  async auth(req: Request, _res: Response): Promise<GlobalUserEntity> {
    let result: GlobalUserEntity;
    let session = this.sessionService.get(req);
    let sandbox: boolean = !!req.body.sandbox;
    let token: string = req.body.token;
    result = await this.checkToken(sandbox, token);
    let oldUser = await this.getTable(req).findOne({where: {sandbox: result.sandbox, username: result.username}});
    if (oldUser) result.id = oldUser.id;
    await this.getTable(req).save(result);
    session.globalUser = result;
    await this.sessionService.save(req);
    return result;
  }

  logout(req: Request, _res: Response): Promise<void> {
    return this.sessionService.clear(req);
  }

  private async checkToken(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    let user: UserEntity;
    try {
      user = await this.evernoteClientService.getUserFromToken(token, sandbox);
    } catch (err) {
      throw new Code403Error(err);
    }
    let result = new GlobalUserEntity();
    result.sandbox = sandbox;
    result.username = user.username;
    result.token = token;
    return result;
  }

}
