import {injectable} from "inversify";
import socketIo = require("socket.io-client");
import Socket = SocketIOClient.Socket;

import {BaseClientService} from "./base-client.service";
import {logger} from "../logger";

@injectable()
export class SocketIoClientService extends BaseClientService {

  private socket: Socket;

  constructor() {
    super();
    logger.debug("socket.io client connection started.");
    this.socket = socketIo.connect();
    this.on(this, "connect", this.onConnect);
    this.on(this, "disconnect", this.onDisconnect);
  }

  on(me: Object, event: string, func: Function) {
    this.socket.on(event, (...args: any[]) => {
      func.call(me, ...args);
    });
  }

  private async onConnect(): Promise<void> {
    logger.debug("socket.io client connection finished.");
  }

  private async onDisconnect(): Promise<void> {
    logger.debug("socket.io client disconnected.");
  }

  async request<T = any>(event: string, ...params: any[]): Promise<T> {
    return await new Promise<T>((resolve) => {
      this.socket.emit(event, ...params, (data: T) => {
        if (data && (<any>data).$$errOccurred === true)
          throw (<any>data).$$errMessage;
        resolve(data)
      });
    });
  }

}
