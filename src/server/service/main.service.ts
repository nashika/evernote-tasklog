import { Server } from "http";

import { injectable } from "inversify";

import logger from "../logger";
import TableService from "./table.service";
import BaseServerService from "./base-server.service";
import SocketIoService from "./socket-io.service";
import SyncService from "~/src/server/service/sync.service";
import EvernoteClientService from "~/src/server/service/evernote-client.service";

@injectable()
export default class MainService extends BaseServerService {
  constructor(
    protected tableService: TableService,
    protected socketIoService: SocketIoService,
    protected syncService: SyncService,
    protected evernoteClientService: EvernoteClientService
  ) {
    super();
  }

  async initialize(server: Server): Promise<void> {
    await this.socketIoService.initialize(server);
    await this.tableService.initialize();
    await this.evernoteClientService.initialize();
    const remoteUser = await this.evernoteClientService.getUser();
    await this.tableService.optionTable.saveValueByKey("user", remoteUser);
    await this.syncService.sync(true);
    logger.info(`Init user finished. data was initialized.`);
  }
}
