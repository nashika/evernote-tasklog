import { injectable } from "inversify";
import { Socket } from "socket.io";

import BaseRoute from "~/src/server/route/base.route";
import SyncSService from "~/src/server/s-service/sync.s-service";

@injectable()
export default class SyncRoute extends BaseRoute {
  constructor(protected syncSService: SyncSService) {
    super();
  }

  get basePath(): string {
    return "sync";
  }

  async connect(socket: Socket): Promise<void> {
    this.on(socket, "run", this.onRun);
  }

  protected async onRun(_socket: Socket): Promise<boolean> {
    await this.syncSService.sync(true);
    return true;
  }
}
