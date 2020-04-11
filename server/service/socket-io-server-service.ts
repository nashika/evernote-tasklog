import { Server as HttpServer } from "http";
import SocketIo from "socket.io";
import { injectable } from "inversify";
import { RequestHandler } from "express";

import { logger } from "../logger";

import { BaseServerService } from "./base-server.service";
import { container } from "~/inversify.config";
// import { BaseRoute } from "~/server/routes/base.route";

const expressSocketIoSession = require("express-socket.io-session");

@injectable()
export class SocketIoServerService extends BaseServerService {
  sessionMiddleware: RequestHandler | null = null;

  private io: SocketIo.Server | null = null;

  async initialize(server: HttpServer): Promise<void> {
    this.io = SocketIo(server);
    this.io.sockets.on("connect", socket => this.connect(socket));
    this.io.use(
      expressSocketIoSession(this.sessionMiddleware, { autoSave: true })
    );
    await Promise.resolve();
  }

  private async connect(socket: SocketIo.Socket): Promise<void> {
    /*
    logger.info(`Connection started. socket.id=${socket.id}.`);
    for (const route of container.getAll<BaseRoute>(BaseRoute)) {
      await route.connect(socket);
    }
    logger.info(`Connection finished. socket.id=${socket.id}.`);
    */
  }

  emitAll(event: string, ...args: any[]) {
    if (!this.io) throw new Error("初期化前にemitAllが呼び出されました");
    this.io.sockets.emit(event, ...args);
  }
}
