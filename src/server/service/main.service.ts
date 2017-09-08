import {Server} from "http";

import {injectable} from "inversify";

import {TableService} from "./table.service";
import {EvernoteClientService} from "./evernote-client.service";
import {BaseServerService} from "./base-server.service";
import {SyncService} from "./sync.service";
import {SocketIoServerService} from "./socket-io-server-service";
import {logger} from "../logger";

@injectable()
export class MainService extends BaseServerService {

  constructor(protected tableService: TableService,
              protected socketIoServerService: SocketIoServerService,
              protected syncService: SyncService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  async initialize(server: Server): Promise<void> {
    await this.socketIoServerService.initialize(server);
    await this.tableService.initialize();
    await this.evernoteClientService.initialize();
    let remoteUser = await this.evernoteClientService.getUser();
    await this.tableService.optionTable.saveValueByKey("user", remoteUser);
    await this.syncService.sync(true);
    logger.info(`Init user finished. data was initialized.`);
  }

}
