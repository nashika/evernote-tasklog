import { Server } from "http";

import { injectable } from "inversify";

import logger from "../logger";
import TableSService from "./table.s-service";
import BaseSService from "./base.s-service";
import SocketIoSService from "./socket-io.s-service";
import SyncSService from "~/src/server/s-service/sync.s-service";
import EvernoteClientSService from "~/src/server/s-service/evernote-client.s-service";

@injectable()
export default class MainSService extends BaseSService {
  constructor(
    protected tableSService: TableSService,
    protected socketIoSService: SocketIoSService,
    protected syncSService: SyncSService,
    protected evernoteClientSService: EvernoteClientSService
  ) {
    super();
  }

  async initialize(server: Server): Promise<void> {
    await this.socketIoSService.initialize(server);
    await this.tableSService.initialize();
    await this.evernoteClientSService.initialize();
    const remoteUser = await this.evernoteClientSService.getUser();
    await this.tableSService.optionTable.saveValueByKey("user", remoteUser);
    await this.syncSService.sync(true);
    logger.info(`Init user finished. data was initialized.`);
  }
}
