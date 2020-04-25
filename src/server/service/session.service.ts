import { injectable } from "inversify";
import socketIo from "socket.io";
import Evernote from "evernote";
import Express from "express";
import ExpressSession from "express-session";
import { TypeormStore } from "connect-typeorm";

import BaseServerService from "./base-server.service";
import logger from "~/src/server/logger";
import TableService from "~/src/server/service/table.service";
import SocketIoService from "~/src/server/service/socket-io.service";

export interface ISession {
  user: Evernote.Types.User;
}

@injectable()
export default class SessionService extends BaseServerService {
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
      }).connect(sessionRepository),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    });
    app.use(sessionMiddleware);
    this.socketIoService.initializeSession(sessionMiddleware);
    logger.info(`セッションサービスの初期化を完了しました.`);
  }

  load(socket: socketIo.Socket, key: string): ISession {
    // @ts-ignore TODO: 動作確認
    return socket.request.session[key];
  }

  async save(socket: socketIo.Socket, key: string, value: any): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      socket.request.session[key] = value;
      socket.request.session.save((err: any) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
