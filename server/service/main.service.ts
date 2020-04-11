import { Server } from "http";

import { injectable } from "inversify";

import { logger } from "../logger";
import { TableService } from "./table.service";
import { BaseServerService } from "./base-server.service";
import { SocketIoServerService } from "./socket-io-server-service";

@injectable()
export class MainService extends BaseServerService {
  constructor(
    protected tableService: TableService, /*
    protected socketIoServerService: SocketIoServerService
    protected syncService: SyncService,
    protected evernoteClientService: EvernoteClientService
     */
  ) {
    super();
  }

  async initialize(_server: Server): Promise<void> {
    // await this.socketIoServerService.initialize(server);
    await this.tableService.initialize();
    // await this.evernoteClientService.initialize();
    // const remoteUser = await this.evernoteClientService.getUser();
    // await this.tableService.optionTable.saveValueByKey("user", remoteUser);
    // await this.syncService.sync(true);
    logger.info(`Init user finished. data was initialized.`);
  }
}
