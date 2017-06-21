import {injectable} from "inversify";

import {BaseRoute} from "./base.route";
import {SyncService} from "../service/sync.service";

@injectable()
export class SyncRoute extends BaseRoute {

  constructor(protected syncService: SyncService) {
    super();
  }

  getBasePath(): string {
    return "sync";
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "run", this.onRun);
  }

  protected async onRun(_socket: SocketIO.Socket): Promise<boolean> {
    await this.syncService.sync(true);
    return true;
  }

}
