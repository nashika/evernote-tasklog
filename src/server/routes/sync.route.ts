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
    return "/sync";
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "run", this.onRun);
    this.on(socket, "updateCount", this.onUpdateCount);
  }

  protected async onRun(socket: SocketIO.Socket): Promise<boolean> {
    let session = this.sessionService.get(socket);
    await this.syncService.sync(session.globalUser, true);
    return true;
  }

  protected async onUpdateCount(socket: SocketIO.Socket): Promise<number> {
    let session = this.sessionService.get(socket);
    return this.syncService.updateCount(session.globalUser);
  }

}
