import SocketIOClient from "socket.io-client";
import logger from "./logger";
import configLoader from "~/common/util/config-loader";

export class SocketIoClientService {
  private socket: SocketIOClient.Socket;

  constructor() {
    logger.debug("socket.io client connection started.");
    this.socket = SocketIOClient.connect(
      configLoader.app.baseUrl || "http://localhost:3000"
    );
    this.on(this, "connect", this.onConnect);
    this.on(this, "disconnect", this.onDisconnect);
  }

  on(me: Object, event: string, func: Function) {
    this.socket.on(event, (...args: any[]) => {
      func.call(me, ...args);
    });
  }

  private onConnect(): void {
    logger.info("socket.io client connection finished.");
  }

  private onDisconnect(): void {
    logger.info("socket.io client disconnected.");
  }

  async request<T = any>(event: string, ...params: any[]): Promise<T> {
    const data = await new Promise<T>(resolve => {
      this.socket.emit(event, ...params, (data: T) => resolve(data));
    });
    if (data && (<any>data).$$errOccurred === true)
      throw (<any>data).$$errMessage;
    return data;
  }
}

let socketIoService: SocketIoClientService;
export default (_app: any, inject: any) => {
  socketIoService = socketIoService || new SocketIoClientService();
  inject("socketIoService", socketIoService);
};
