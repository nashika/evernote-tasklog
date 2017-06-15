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
    logger.debug(`socket.io request started, event="${event}", params=${JSON.stringify(params)}`);
    let data = await new Promise<T>((resolve) => {
      this.socket.emit(event, ...params, (data: T) => resolve(data));
    });
    logger.debug(`socket.io request finished, event="${event}", params=${JSON.stringify(params)}`);
    if (data && (<any>data).$$errOccurred === true)
      throw (<any>data).$$errMessage;
    return data;
  }

}
