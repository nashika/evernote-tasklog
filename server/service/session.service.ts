import { injectable } from "inversify";
import socketIo from "socket.io";
import Evernote from "evernote";

import BaseServerService from "./base-server.service";

export interface ISession {
  user: Evernote.Types.User;
}

@injectable()
export default class SessionService extends BaseServerService {
  async initialize() {}

  load(socket: socketIo.Socket, key: string): ISession {
    // @ts-ignore
    return socket.handshake.session[key];
  }

  async save(socket: socketIo.Socket, key: string, value: any): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      // @ts-ignore
      socket.handshake.session[key] = value;
      // @ts-ignore
      socket.handshake.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
