import {injectable} from "inversify";

import {BaseServerService} from "./base-server.service";

export interface ISession {
  user: Evernote.User;
}

@injectable()
export class SessionService extends BaseServerService {

  load(socket: SocketIO.Socket, key: string): ISession {
    let session: Express.Session = (<any>socket.handshake).session;
    return session[key];
  }

  async save(socket: SocketIO.Socket, key: string, value: any): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let session: Express.Session = (<any>socket.handshake).session;
      session[key] = value;
      session.save(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

}
