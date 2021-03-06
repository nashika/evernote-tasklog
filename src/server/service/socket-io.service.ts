import { Server as HttpServer } from "http";
import SocketIo from "socket.io";
import { injectable } from "inversify";

import { BaseServerService } from "./base-server.service";
import { logger } from "~/src/common/logger";
import { container } from "~/src/common/inversify.config";
import { BaseRoute } from "~/src/server/route/base.route";
import { SYMBOL_TYPES } from "~/src/common/symbols";

@injectable()
export class SocketIoService extends BaseServerService {
  private io!: SocketIo.Server;

  initialize(server: HttpServer) {
    logger.info("Socket.IOサービスの初期化を開始しました.");
    this.io = new SocketIo.Server(server);
    this.io.sockets.on("connect", (socket) => this.connect(socket));
    logger.info("Socket.IOサービスの初期化を完了しました.");
  }

  initializeSession(sessionMiddleware: any) {
    this.io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    });
  }

  private async connect(socket: SocketIo.Socket): Promise<void> {
    logger.info(`Socket.IOによる接続が開始されました. socket.id=${socket.id}.`);
    for (const route of container.getAll<BaseRoute>(SYMBOL_TYPES.Route)) {
      await route.connect(socket);
    }
    logger.info(`Socket.IOによる接続が終了しました. socket.id=${socket.id}.`);
  }

  emitAll(event: string, ...args: any[]) {
    if (!this.io) throw new Error("初期化前にemitAllが呼び出されました");
    this.io.sockets.emit(event, ...args);
  }
}
