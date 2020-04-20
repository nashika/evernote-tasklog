import { injectable } from "inversify";
import SocketIO from "socket.io";

import BaseRoute from "~/src/server/route/base.route";
import SessionSService from "~/src/server/s-service/session.s-service";

@injectable()
export default class SessionRoute extends BaseRoute {
  constructor(protected sessionSService: SessionSService) {
    super();
  }

  get basePath(): string {
    return "session";
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "load", this.onLoad);
    this.on(socket, "save", this.onSave);
  }

  protected async onLoad(socket: SocketIO.Socket, key: string): Promise<any> {
    return this.sessionSService.load(socket, key);
  }

  protected async onSave(
    socket: SocketIO.Socket,
    key: string,
    value: any
  ): Promise<boolean> {
    await this.sessionSService.save(socket, key, value);
    return true;
  }
}
