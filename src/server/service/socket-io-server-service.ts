import socketIo = require("socket.io");
import {Server as HttpServer} from "http";
import {injectable} from "inversify";
import {RequestHandler} from "express";
const expressSocketIoSession = require("express-socket.io-session");

import {BaseServerService} from "./base-server.service";
import {container} from "../inversify.config";
import {BaseRoute} from "../routes/base.route";
import {logger} from "../logger";


@injectable()
export class SocketIoServerService extends BaseServerService {

  sessionMiddleware: RequestHandler;

  private io: SocketIO.Server;

  async initialize(server: HttpServer): Promise<void> {
    this.io = socketIo(server);
    this.io.sockets.on("connect", socket => this.connect(socket));
    this.io.use(expressSocketIoSession(this.sessionMiddleware, {autoSave: true}));
  }

  private async connect(socket: SocketIO.Socket): Promise<void> {
    logger.info(`Connection started. socket.id=${socket.id}.`);
    for (let route of container.getAll<BaseRoute>(BaseRoute))
      await route.connect(socket);
    logger.info(`Connection finished. socket.id=${socket.id}.`);
  }

  emitAll(event: string, ...args: any[]) {
    this.io.sockets.emit(event, ...args);
  }

}
