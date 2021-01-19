import { injectable } from "inversify";
import socketIo from "socket.io";
import Evernote from "evernote";
import Express from "express";
import ExpressSession from "express-session";
import { TypeormStore } from "connect-typeorm";

import { BaseServerService } from "./base-server.service";
import { logger } from "~/src/common/logger";
import { TableService } from "~/src/server/service/table.service";
import { SocketIoService } from "~/src/server/service/socket-io.service";

export interface ISession {
  user: Evernote.Types.User;
}

@injectable()
export class SessionService extends BaseServerService {
  constructor(
    protected tableService: TableService,
    protected socketIoService: SocketIoService
  ) {
    super();
  }

  async initialize(app: Express.Application) {
    logger.info(`セッションサービスの初期化を開始します.`);
    const sessionRepository = this.tableService.sessionTable.repository;
    const sessionMiddleware = ExpressSession({
      name: "evernote-tasklog.connect.sid",
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: true,
      store: new TypeormStore({
        cleanupLimit: 100,
      }).connect(<any>sessionRepository),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    });
    app.use(sessionMiddleware);
    this.socketIoService.initializeSession(sessionMiddleware);
    logger.info(`セッションサービスの初期化を完了しました.`);
  }

  load(socket: socketIo.Socket, key: string): ISession {
    return (<any>socket.request).session[key];
  }

  async save(socket: socketIo.Socket, key: string, value: any): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      (<any>socket.request).session[key] = value;
      (<any>socket.request).session.save((err: any) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
