import {injectable} from "inversify";
import {Evernote} from "evernote";

import {BaseServerService} from "./base-server.service";

export interface ISession {
  user: Evernote.User;
}

@injectable()
export class SessionService extends BaseServerService {

  get(socket: SocketIO.Socket): ISession {
    if (!socket.handshake.session["evernote"])
      socket.handshake.session["evernote"] = {};
    return socket.handshake.session["evernote"];
  }

  async clear(socket: SocketIO.Socket): Promise<void> {
    socket.handshake.session["evernote"] = null;
    await this.save(socket);
  }

  async save(socket: SocketIO.Socket): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      socket.handshake.session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
