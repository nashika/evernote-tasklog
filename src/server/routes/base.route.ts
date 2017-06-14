import _ = require("lodash");
import {injectable} from "inversify";

import {logger} from "../logger";

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

  protected on(socket: SocketIO.Socket, action: string, func: (...args: any[]) => Promise<any>) {
    let event = this.getBasePath() + "::" + action;
    socket.on(event, (...args: any[]) => {
      let ack: (data: any) => void = _.last(args);
      let funcArgs: any[] = _.initial(args);
      logger.info(`Request from id="${socket.id}", event="${event}", args=${JSON.stringify(funcArgs)}}`);
      (<Promise<any>>func.call(this, socket, ...funcArgs)).then(data => {
        ack(data);
      }).catch(err => {
        logger.error(`Error occurred in socket.io request. id="${socket.id}", event="${event}", args="${JSON.stringify(funcArgs)}".\n${err.stack || err}`);
        ack({$$err: true, $$errMessage: err.toString()});
      });
    });
  }

}
