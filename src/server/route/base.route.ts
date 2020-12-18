import _ from "lodash";
import SocketIO from "socket.io";
import { injectable } from "inversify";

import logger from "../logger";

export abstract class CodeError extends Error {
  code: number = 0;
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
export default abstract class BaseRoute {
  abstract get basePath(): string;

  abstract async connect(_socket: SocketIO.Socket): Promise<void>;

  protected on(
    socket: SocketIO.Socket,
    action: string,
    func: (...args: any[]) => Promise<any>
  ) {
    const event = this.basePath + "::" + action;
    socket.on(event, (...args: any[]) => {
      const ack: (data: any) => void = _.last(args);
      const funcArgs: any[] = _.initial(args);
      logger.info(
        `Request from id="${
          socket.id
        }", event="${event}", args=${JSON.stringify(funcArgs)}}`
      );
      (<Promise<any>>func.call(this, socket, ...funcArgs))
        .then((data) => {
          ack(data);
        })
        .catch((err) => {
          logger.error(
            `Error occurred in socket.io request. id="${
              socket.id
            }", event="${event}", args="${JSON.stringify(funcArgs)}".\n${
              err.stack || err
            }`
          );
          ack({ $$err: true, $$errMessage: err.toString() });
        });
    });
  }
}
