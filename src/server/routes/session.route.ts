import {injectable} from "inversify";

import {BaseRoute} from "./base.route";
import {SessionService} from "../service/session.service";

@injectable()
export class SessionRoute extends BaseRoute {

  constructor(protected sessionService: SessionService) {
    super();
  }

  getBasePath(): string {
    return "session";
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "load", this.onLoad);
    this.on(socket, "save", this.onSave);
  }

  protected async onLoad(socket: SocketIO.Socket, key: string): Promise<any> {
    return await this.sessionService.load(socket, key);
  }

  protected async onSave(socket: SocketIO.Socket, key: string, value: any): Promise<boolean> {
    await this.sessionService.save(socket, key, value);
    return true;
  }

}
