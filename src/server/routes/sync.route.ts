import {injectable} from "inversify";

import {BaseRoute} from "./base.route";
import {SessionService} from "../service/session.service";
import {SyncService} from "../service/sync.service";

@injectable()
export class SyncRoute extends BaseRoute {

  constructor(protected sessionService: SessionService,
              protected syncService: SyncService) {
    super();
  }

  getBasePath(): string {
    return "sync";
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "run", this.onRun);
    this.on(socket, "updateCount", this.onUpdateCount);
  }

  protected async onRun(_socket: SocketIO.Socket): Promise<boolean> {
    await this.syncService.sync(true);
    return true;
  }

  protected async onUpdateCount(_socket: SocketIO.Socket): Promise<number> {
    return this.syncService.updateCount;
  }

}
