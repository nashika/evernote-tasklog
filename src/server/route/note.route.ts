import { injectable } from "inversify";
import SocketIO from "socket.io";

import { BaseEntityRoute } from "~/src/server/route/base-entity.route";
import { NoteEntity } from "~/src/common/entity/note.entity";
import { SessionService } from "~/src/server/service/session.service";
import { TableService } from "~/src/server/service/table.service";
import { NoteTable } from "~/src/server/table/note.table";
import { SyncService } from "~/src/server/service/sync.service";
import { FindEntityWhereOptions } from "~/src/common/entity/base.entity";

@injectable()
export class NoteRoute extends BaseEntityRoute<NoteEntity, NoteTable> {
  constructor(
    protected tableService: TableService,
    protected sessionService: SessionService,
    protected syncService: SyncService
  ) {
    super(tableService, sessionService);
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
    await this.syncService.lock();
    const note = await this.table.loadRemote(guid);
    await this.syncService.unlock();
    return note;
  }

  protected async onReParse(
    _socket: SocketIO.Socket,
    query: FindEntityWhereOptions<NoteEntity>
  ): Promise<boolean> {
    await this.syncService.lock();
    await this.table.reParseNotes(query);
    await this.syncService.unlock();
    return true;
  }
}
