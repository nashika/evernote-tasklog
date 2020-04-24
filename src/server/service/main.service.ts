import { Server } from "http";
import Express from "express";

import { injectable } from "inversify";

import logger from "../logger";
import TableService from "./table.service";
import BaseServerService from "./base-server.service";
import SocketIoService from "./socket-io.service";
import SyncService from "~/src/server/service/sync.service";
import EvernoteClientService from "~/src/server/service/evernote-client.service";
import SessionService from "~/src/server/service/session.service";

@injectable()
export default class MainService extends BaseServerService {
  constructor(
    protected tableService: TableService,
    protected socketIoService: SocketIoService,
    protected syncService: SyncService,
    protected evernoteClientService: EvernoteClientService,
    protected sessionService: SessionService
  ) {
    super();
  }

  async initialize(app: Express.Application, server: Server): Promise<void> {
    logger.info(`サービスの初期化を開始します.`);
    this.socketIoService.initialize(server);
    await this.tableService.initialize();
    this.evernoteClientService.initialize();
    await this.sessionService.initialize(app);
    logger.info(`サービスの初期化を完了しました.`);
    const remoteUser = await this.evernoteClientService.getUser();
    await this.tableService.optionTable.saveValueByKey("user", remoteUser);
    await this.syncService.sync(true);
    logger.info(`Init user finished. data was initialized.`);
  }
}
