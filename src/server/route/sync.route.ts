import { injectable } from "inversify";
import { Socket } from "socket.io";

import { BaseRoute } from "~/src/server/route/base.route";
import { SyncService } from "~/src/server/service/sync.service";

@injectable()
export class SyncRoute extends BaseRoute {
  constructor(protected syncService: SyncService) {
    super();
  }

  get basePath(): string {
    return "sync";
  }

  async connect(socket: Socket): Promise<void> {
    this.on(socket, "run", this.onRun);
  }

  protected async onRun(_socket: Socket): Promise<boolean> {
    await this.syncService.sync(true);
    return true;
  }
}
