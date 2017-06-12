import _ = require("lodash");
import log4js = require("log4js");
import {injectable} from "inversify";

let logger = log4js.getLogger("system");

export class CodeError extends Error {
  code: number;
}

export class Code403Error extends CodeError {
  code: number = 403;
  message: string = "Access Forbidden";
}

export class Code404Error extends CodeError {
  code: number = 404;
  message: string = "Not Found";
}

export class Code500Error extends CodeError {
  code: number = 500;
  message: string = "Internal Server Error";
}

@injectable()
export abstract class BaseRoute {

  abstract getBasePath(): string;

  abstract async connect(_socket: SocketIO.Socket): Promise<void>;

  protected on(socket: SocketIO.Socket, event: string, func: (...args: any[]) => Promise<any>) {
    socket.on(event, (...args: any[]) => {
      let ack: (data: any) => void = _.last(args);
      let funcArgs: any[] = _.initial(args);
      (<Promise<any>>func.call(this, ...funcArgs)).then(data => {
        ack(data);
      }).catch(err => {
        logger.error(err);
      });
    });
  }

}
