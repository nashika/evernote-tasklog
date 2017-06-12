import {injectable} from "inversify";
import {Evernote} from "evernote";

import {TableService} from "../service/table.service";
import {EvernoteClientService} from "../service/evernote-client.service";
import {GlobalUserEntity} from "../../common/entity/global-user.entity";
import {BaseEntityRoute} from "./base-entity.route";
import {GlobalUserTable} from "../table/global-user.table";
import {Code403Error} from "./base.route";
import {SessionService} from "../service/session.service";
import {MainService} from "../service/main.service";

@injectable()
export class GlobalUserRoute extends BaseEntityRoute<GlobalUserEntity, GlobalUserTable> {

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService,
              protected sessionService: SessionService,
              protected mainService: MainService) {
    super(tableService, sessionService);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    await super.connect(socket);
    await this.on(socket, "load", this.onLoad);
    await this.on(socket, "change", this.onChange);
    await this.on(socket, "auth", this.onAuth);
    await this.on(socket, "logout", this.onLogout);
  }

  protected async onLoad(socket: SocketIO.Socket): Promise<GlobalUserEntity> {
    let session = this.sessionService.get(socket);
    return session.globalUser && session.globalUser.key ? session.globalUser : null;
  }

  protected async onChange(socket: SocketIO.Socket, data: Object): Promise<void> {
    let globalUserEntity: GlobalUserEntity = new GlobalUserEntity(data);
    let session = this.sessionService.get(socket);
    session.globalUser = globalUserEntity;
    await this.sessionService.save(socket);
  }

  protected async onAuth(socket: SocketIO.Socket, sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    let globalUserEntity: GlobalUserEntity;
    let session = this.sessionService.get(socket);
    globalUserEntity = await this.checkToken(sandbox, token);
    await this.getTable(socket).save(globalUserEntity);
    await this.mainService.initializeUser(globalUserEntity);
    session.globalUser = globalUserEntity;
    await this.sessionService.save(socket);
    return globalUserEntity;
  }

  protected async onLogout(socket: SocketIO.Socket): Promise<void> {
    await this.sessionService.clear(socket);
  }

  private async checkToken(sandbox: boolean, token: string): Promise<GlobalUserEntity> {
    let user: Evernote.User;
    try {
      user = await this.evernoteClientService.getUserFromToken(token, sandbox);
    } catch (err) {
      throw new Code403Error(err);
    }
    let globalUserEntity = new GlobalUserEntity();
    globalUserEntity.key = (sandbox ? "s_" : "") + user.username;
    globalUserEntity.sandbox = sandbox;
    globalUserEntity.username = user.username;
    globalUserEntity.token = token;
    return globalUserEntity;
  }

}
