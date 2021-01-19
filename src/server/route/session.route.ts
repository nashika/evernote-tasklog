import { injectable } from "inversify";
import SocketIO from "socket.io";

import { BaseRoute } from "~/src/server/route/base.route";
import { SessionService } from "~/src/server/service/session.service";

@injectable()
export class SessionRoute extends BaseRoute {
  constructor(protected sessionService: SessionService) {
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
    return this.sessionService.load(socket, key);
  }

  protected async onSave(
    socket: SocketIO.Socket,
    key: string,
    value: any
  ): Promise<boolean> {
    await this.sessionService.save(socket, key, value);
    return true;
  }
}
