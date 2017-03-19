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
import {MainService} from "../service/main.service";

@injectable()
export class GlobalUserRoute extends BaseMultiRoute<GlobalUserEntity, GlobalUserTable> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected sessionService: SessionService,
              protected mainService: MainService) {
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
    return session.globalUser && session.globalUser.key ? session.globalUser : null;
  }

  async change(req: Request, _res: Response): Promise<void> {
    let globalUserEntity: GlobalUserEntity = new GlobalUserEntity(req.body);
    let session = this.sessionService.get(req);
    session.globalUser = globalUserEntity;
    await this.sessionService.save(req);
  }

  async auth(req: Request, _res: Response): Promise<GlobalUserEntity> {
    let globalUserEntity: GlobalUserEntity;
    let session = this.sessionService.get(req);
    let sandbox: boolean = !!req.body.sandbox;
    let token: string = req.body.token;
    globalUserEntity = await this.checkToken(sandbox, token);
    await this.getTable(req).save(globalUserEntity);
    await this.mainService.initializeUser(globalUserEntity);
    session.globalUser = globalUserEntity;
    await this.sessionService.save(req);
    return globalUserEntity;
  }

  logout(req: Request, _res: Response): Promise<void> {
    return this.sessionService.clear(req);
  }

  private async checkToken(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    let userEntity: UserEntity;
    try {
      userEntity = await this.evernoteClientService.getUserFromToken(token, sandbox);
    } catch (err) {
      throw new Code403Error(err);
    }
    let globalUserEntity = new GlobalUserEntity();
    globalUserEntity.key = (sandbox ? "s_" : "") + userEntity.username;
    globalUserEntity.sandbox = sandbox;
    globalUserEntity.username = userEntity.username;
    globalUserEntity.token = token;
    return globalUserEntity;
  }

}
