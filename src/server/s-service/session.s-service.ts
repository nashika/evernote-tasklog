import { injectable } from "inversify";
import socketIo from "socket.io";
import Evernote from "evernote";

import BaseSService from "./base.s-service";

export interface ISession {
  user: Evernote.Types.User;
}

@injectable()
export default class SessionSService extends BaseSService {
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
