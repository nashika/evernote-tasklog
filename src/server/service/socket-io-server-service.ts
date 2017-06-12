import socketIo = require("socket.io");
import {Server as HttpServer} from "http";
import _ = require("lodash");
import {injectable} from "inversify";
import {getLogger} from "log4js";

import {BaseServerService} from "./base-server.service";
import {container} from "../inversify.config";
import {BaseRoute} from "../routes/base.route";

const logger = getLogger("system");

@injectable()
export class SocketIoServerService extends BaseServerService {

  private io: SocketIO.Server;

  async initializeGlobal(server: HttpServer): Promise<void> {
    this.io = socketIo(server);
    this.io.sockets.on("connect", socket => this.connect(socket));
  }

  private async connect(socket: SocketIO.Socket): Promise<void> {
    logger.info(`Connect from socket.id=${socket.id}.`);
    for (let route of container.getAll<BaseRoute>(BaseRoute))
      await route.connect(socket);
  }

  emitAll(event: string, ...args: any[]) {
    this.io.sockets.emit(event, ...args);
  }

}
