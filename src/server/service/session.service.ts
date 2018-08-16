import {injectable} from "inversify";

import {BaseServerService} from "./base-server.service";

export interface ISession {
  user: any;
}

@injectable()
export class SessionService extends BaseServerService {

  load(socket: SocketIO.Socket, key: string): ISession {
    return socket.handshake.session[key];
  }

  async save(socket: SocketIO.Socket, key: string, value: any): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      socket.handshake.session[key] = value;
      socket.handshake.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
