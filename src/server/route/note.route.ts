import { injectable } from "inversify";
import SocketIO from "socket.io";

import BaseEntityRoute from "~/src/server/route/base-entity.route";
import NoteEntity from "~/src/common/entity/note.entity";
import SessionSService from "~/src/server/s-service/session.s-service";
import TableSService from "~/src/server/s-service/table.s-service";
import NoteTable from "~/src/server/table/note.table";
import SyncSService from "~/src/server/s-service/sync.s-service";
import { FindEntityWhereOptions } from "~/src/common/entity/base.entity";

@injectable()
export default class NoteRoute extends BaseEntityRoute<NoteEntity, NoteTable> {
  constructor(
    protected tableSService: TableSService,
    protected sessionSService: SessionSService,
    protected syncSService: SyncSService
  ) {
    super(tableSService, sessionSService);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    await super.connect(socket);
    this.on(socket, "getContent", this.onGetContent);
    this.on(socket, "reParse", this.onReParse);
  }

  protected async onGetContent(
    _socket: SocketIO.Socket,
    guid: string
  ): Promise<NoteEntity | null> {
    if (!guid) return null;
    await this.syncSService.lock();
    const note = await this.table.loadRemote(guid);
    await this.syncSService.unlock();
    return note;
  }

  protected async onReParse(
    _socket: SocketIO.Socket,
    query: FindEntityWhereOptions<NoteEntity>
  ): Promise<boolean> {
    await this.syncSService.lock();
    await this.table.reParseNotes(query);
    await this.syncSService.unlock();
    return true;
  }
}
